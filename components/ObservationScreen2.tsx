import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { addObservation, updateObservation, getAiAnalysis, addAssessmentForObservation } from '../services/api';
import type { DevelopmentDomain, ObservationContext, Observation } from '../types';
import { t, DEVELOPMENT_DOMAINS, OBSERVATION_CONTEXTS } from '../constants.clean';

interface Props {
  childId: string;
  navigate: (page: string, params?: any) => void;
  observationToEdit?: Observation;
}

const ObservationScreen: React.FC<Props> = ({ childId, navigate, observationToEdit }) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [domains, setDomains] = useState<DevelopmentDomain[]>([]);
  const [context, setContext] = useState<ObservationContext>('classroom');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!observationToEdit;

  useEffect(() => {
    if (isEditMode && observationToEdit) {
      setNote(observationToEdit.note);
      setDomains(observationToEdit.domains);
      setContext(observationToEdit.context || 'classroom');
      setTags((observationToEdit.tags || []).join(', '));
    }
  }, [isEditMode, observationToEdit]);

  const toggleDomain = (d: DevelopmentDomain) => {
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !note) { alert(t('errorOccurred')); return; }
    if (domains.length === 0) { alert((t as any)('domainsRequired') || 'Lutfen en az bir gelisim alani secin.'); return; }
    setLoading(true);
    const payload = {
      child_id: childId,
      note,
      domains,
      context,
      tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
    };

    try {
      if (isEditMode && observationToEdit) {
        await updateObservation(observationToEdit.id, payload);
      } else {
        const created = await addObservation(payload, user.id);
        if (navigator.onLine && created && (created as any).id) {
          (async () => {
            try {
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
      navigate('child-detail', { id: childId });
    } catch (err) {
      console.error(err);
      alert(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isEditMode ? t('editObservation') : t('addObservation')}</h1>
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
            {Object.keys(DEVELOPMENT_DOMAINS).map((key) => {
              const d = key as DevelopmentDomain;
              const selected = domains.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 text-sm rounded-full border ${selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700'}`}
                >
                  {DEVELOPMENT_DOMAINS[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700">{t('context')}</label>
          <select
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value as ObservationContext)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            {Object.keys(OBSERVATION_CONTEXTS).map((key) => (
              <option key={key} value={key}>{OBSERVATION_CONTEXTS[key as ObservationContext]}</option>
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
          <button type="button" onClick={() => navigate('child-detail', { id: childId })} className="px-4 py-2 bg-gray-200 rounded-md">{t('cancel')}</button>
          <button type="submit" disabled={loading || domains.length === 0} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">{loading ? t('loading') : t('save')}</button>
        </div>
      </form>
    </div>
  );
};

export default ObservationScreen;


