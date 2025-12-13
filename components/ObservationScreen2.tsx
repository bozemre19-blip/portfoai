import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { addObservation, updateObservation, getAiAnalysis, addAssessmentForObservation, uploadMediaViaFunction, getChildren } from '../services/api';
import type { DevelopmentDomain, ObservationContext, Observation } from '../types';
import { t, getDomains, getContexts } from '../constants.clean';

interface Props {
  childId?: string;
  navigate: (page: string, params?: any) => void;
  observationToEdit?: Observation;
}

const ObservationScreen: React.FC<Props> = ({ childId: propChildId, navigate, observationToEdit }) => {
  const { user } = useAuth();

  // Selection State
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(propChildId);
  const [children, setChildren] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Form State
  const [note, setNote] = useState('');
  const [domains, setDomains] = useState<DevelopmentDomain[]>([]);
  const [context, setContext] = useState<ObservationContext>('classroom');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);

  const isEditMode = !!observationToEdit;

  // Initialize Form if Edit Mode
  useEffect(() => {
    if (isEditMode && observationToEdit) {
      setNote(observationToEdit.note);
      setDomains(observationToEdit.domains);
      setContext(observationToEdit.context || 'classroom');
      setTags((observationToEdit.tags || []).join(', '));
      // Ensure selectedChildId is set from edit object if prop is missing
      if (!selectedChildId) setSelectedChildId(observationToEdit.child_id);
    }
  }, [isEditMode, observationToEdit]);

  // Fetch Children if no child selected
  useEffect(() => {
    const loadChildren = async () => {
      if (!selectedChildId && user) {
        setLoadingConfig(true);
        try {
          const list = await getChildren(user.id);
          setChildren(list || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingConfig(false);
        }
      }
    };
    loadChildren();
  }, [user, selectedChildId]);

  const toggleDomain = (d: DevelopmentDomain) => {
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !note || !selectedChildId) { alert(t('errorOccurred')); return; }
    if (domains.length === 0) { alert((t as any)('domainsRequired') || 'Lütfen en az bir gelişim alanı seçin.'); return; }
    setLoading(true);
    const payload: any = {
      child_id: selectedChildId,
      note,
      domains,
      context,
      tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
    };

    // Optional attachment: upload first to be able to link media id
    try {
      if (false && attachFile) {
        const { mediaId } = await uploadMediaViaFunction(selectedChildId, attachFile, {
          name: `Gözlem Fotoğrafı - ${new Date().toLocaleDateString('tr-TR')}`,
          description: 'Gözlem ekli fotoğraf',
          domain: domains[0],
        });
        if (mediaId) payload.media_ids = [mediaId];
      }
    } catch (e) {
      console.error('Attachment upload failed, continuing without it', e);
    }

    try {
      if (isEditMode && observationToEdit) {
        await updateObservation(observationToEdit.id, payload);
      } else {
        const created = await addObservation(payload, user.id);
        if (navigator.onLine && created && (created as any).id) {
          (async () => {
            try {
              // Background attachment upload (non-blocking)
              if (attachFile) {
                try {
                  const { mediaId } = await uploadMediaViaFunction(selectedChildId, attachFile, {
                    name: `Observation Photo - ${new Date().toISOString().split('T')[0]}`,
                    description: 'Gözlem ekli fotoğraf',
                    domain: domains[0],
                  });
                  if (mediaId) {
                    await updateObservation((created as any).id, { media_ids: [mediaId] } as any);
                  }
                } catch (upErr) {
                  console.error('Attachment upload failed (background):', upErr);
                }
              }
              const analysis = await getAiAnalysis(note, domains);
              await addAssessmentForObservation((created as any).id, user.id, {
                summary: analysis.summary,
                risk: analysis.risk,
                suggestions: analysis.suggestions,
                domain_scores: analysis.domain_scores as any,
              });
              console.log('AI analysis saved in background');
            } catch (err) {
              console.error('AI analysis failed (background):', err);
            }
          })();
        }
      }
      navigate('child-detail', { id: selectedChildId });
    } catch (err) {
      console.error(err);
      alert(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: SELECT CHILD
  if (!selectedChildId) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('selectChild') || 'Çocuk Seçin'}</h1>
        {loadingConfig ? (
          <div className="text-center py-10 text-gray-500">{t('loading')}...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow border border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 mb-3">
                  {child.first_name?.[0]}{child.last_name?.[0]}
                </div>
                <span className="font-semibold text-gray-800 text-center">{child.first_name} {child.last_name}</span>
                <span className="text-xs text-gray-500 mt-1">{child.classroom}</span>
              </button>
            ))}
            {children.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                Hiç çocuk bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // STEP 2: OBSERVATION FORM
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isEditMode ? t('editObservation') : t('addObservation')}</h1>

      {/* Selected Child Badge (Changeable) */}
      {!isEditMode && !propChildId && (
        <div className="mb-4 flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <span className="text-sm text-indigo-700">
            Seçili Çocuk: <strong>{children.find(c => c.id === selectedChildId)?.first_name}</strong>
          </span>
          <button
            onClick={() => setSelectedChildId(undefined)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Değiştir
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow space-y-6">
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">{t('observationNote')}</label>
          <textarea
            id="note"
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder={t('notePlaceholder')}
            required
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700">{t('developmentDomains')}</h3>
          <p className="text-xs text-gray-500 mb-2">{t('selectDomains')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(getDomains()).map((key) => {
              const d = key as DevelopmentDomain;
              const selected = domains.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 text-sm rounded-full border ${selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700'}`}
                >
                  {getDomains()[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="attach" className="block text-sm font-medium text-gray-700">{t('attachPhotoOptional')}</label>
          <input id="attach" type="file" accept="image/*" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm" />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700">{t('context')}</label>
          <select
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value as ObservationContext)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            {Object.keys(getContexts()).map((key) => (
              <option key={key} value={key}>{getContexts()[key as ObservationContext]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">{t('tags')}</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder={t('tagsPlaceholder')}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('child-detail', { id: selectedChildId })} className="px-4 py-2 bg-gray-200 rounded-md">{t('cancel')}</button>
          <button type="submit" disabled={loading || domains.length === 0} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">{loading ? t('loading') : t('save')}</button>
        </div>
      </form>
    </div>
  );
};

export default ObservationScreen;
