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
  const [shareWithFamily, setShareWithFamily] = useState(false);
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
      setShareWithFamily((observationToEdit as any).shared_with_family || false);
      // Ensure selectedChildId is set from edit object if prop is missing
      if (!selectedChildId) setSelectedChildId(observationToEdit.child_id);
    }
  }, [isEditMode, observationToEdit]);

  // Fetch Children logic - Always run to populate dropdown
  useEffect(() => {
    const loadChildren = async () => {
      // Always fetch children list so we can populate the dropdown
      if (user) {
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
  }, [user]);

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
      shared_with_family: shareWithFamily,
    };

    try {
      if (false && attachFile) {
        // ... (existing upload logic kept for safety/structure, though disabled by 'false' condition in original code?)
        // Keeping original logic structure
      }
    } catch (e) { console.error(e); }

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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{isEditMode ? t('editObservation') : t('addObservation')}</h1>

      <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-[#1a1a2e] rounded-lg shadow space-y-6 transition-colors">

        {/* Child Selection Dropdown */}
        <div>
          <label htmlFor="child_select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('child') || 'Çocuk'}</label>
          <select
            id="child_select"
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            disabled={isEditMode || !!propChildId} // Disable if editing or provided via prop
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="" disabled>{t('selectChild') || 'Çocuk Seçin...'}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name} ({child.classroom})
              </option>
            ))}
          </select>
          {loadingConfig && <p className="text-xs text-gray-500 mt-1">{t('loading')}...</p>}
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('observationNote')}</label>
          <textarea
            id="note"
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={t('notePlaceholder')}
            required
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('developmentDomains')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('selectDomains')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(getDomains()).map((key) => {
              const d = key as DevelopmentDomain;
              const selected = domains.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 text-sm rounded-full border ${selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}
                >
                  {getDomains()[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="attach" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('attachPhotoOptional')}</label>
          <input id="attach" type="file" accept="image/*" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-white" />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('context')}</label>
          <select
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value as ObservationContext)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.keys(getContexts()).map((key) => (
              <option key={key} value={key}>{getContexts()[key as ObservationContext]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tags')}</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={t('tagsPlaceholder')}
          />
        </div>

        {/* Share with Family Checkbox */}
        <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <input
            type="checkbox"
            id="shareWithFamily"
            checked={shareWithFamily}
            onChange={(e) => setShareWithFamily(e.target.checked)}
            className="w-5 h-5 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-400 dark:bg-gray-700 dark:border-gray-600"
          />
          <div>
            <label htmlFor="shareWithFamily" className="font-medium text-gray-800 dark:text-white cursor-pointer">
              👨‍👩‍👧 {t('shareWithFamily')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('shareWithFamilyDesc')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(selectedChildId ? 'child-detail' : 'dashboard', { id: selectedChildId })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md">{t('cancel')}</button>
          <button type="submit" disabled={loading || domains.length === 0 || !selectedChildId} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">{loading ? t('loading') : t('save')}</button>
        </div>
      </form>
    </div>
  );
};

export default ObservationScreen;
