
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { addObservation, updateObservation, getAiAnalysis, addAssessmentForObservation } from '../services/api';
import type { DevelopmentDomain, ObservationContext, Observation } from '../types';
import { t, DEVELOPMENT_DOMAINS, OBSERVATION_CONTEXTS } from '../constants.clean';

interface ObservationScreenProps {
  childId: string;
  navigate: (page: string, params?: any) => void;
  observationToEdit?: Observation;
}

const ObservationScreen: React.FC<ObservationScreenProps> = ({ childId, navigate, observationToEdit }) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [domains, setDomains] = useState<DevelopmentDomain[]>([]);
  const [context, setContext] = useState<ObservationContext>('classroom');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const [sttSupported, setSttSupported] = useState<boolean>(false);
  const [baseNote, setBaseNote] = useState<string>('');
  const [sessionTranscript, setSessionTranscript] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  

  const isEditMode = !!observationToEdit;

  useEffect(() => {
    if (isEditMode) {
      setNote(observationToEdit.note);
      setDomains(observationToEdit.domains);
      setContext(observationToEdit.context || 'classroom');
      setTags((observationToEdit.tags || []).join(', '));
    }
  }, [observationToEdit, isEditMode]);

  useEffect(() => {
    const R: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (R) {
      setSttSupported(true);
      const rec = new R();
      rec.lang = 'tr-TR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (ev: any) => {
        try {
          // Build combined transcript (final+interim) for live update
          let combined = '';
          for (let i = 0; i < ev.results.length; i++) {
            combined += ev.results[i][0].transcript;
          }
          setSessionTranscript(combined);
          const prefix = baseNote ? (baseNote.trim() + ' ') : '';
          setNote((prefix + combined).trim());
        } catch { /* noop */ }
      };
      rec.onerror = (_e: any) => { setIsRecording(false); };
      rec.onend = () => { setIsRecording(false); setSessionTranscript(''); setBaseNote(''); };
      recognitionRef.current = rec;
    } else {
      setSttSupported(false);
    }
    return () => {
      try { recognitionRef.current?.stop?.(); } catch {}
    };
  }, []);

  const toggleRecording = () => {
    if (!sttSupported || !recognitionRef.current) { alert('Tarayıcı sesten metne özelliğini desteklemiyor. Lütfen Chrome/Edge kullanın.'); return; } const rec = recognitionRef.current as any;
    if (isRecording) { try { rec.stop(); } catch {} setIsRecording(false); }
    else { try { setBaseNote(note); setSessionTranscript(''); rec.start(); setIsRecording(true); } catch { /* already started */ } }
  };

  


  const handleDomainToggle = (domain: DevelopmentDomain) => {
    setDomains(prev => 
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !note) {
        alert(t('errorOccurred'));
        return;
    }
    if (domains.length === 0) {
        alert((t as any)('domainsRequired') || 'LÃ¼tfen en az bir geliÅŸim alanÄ± seÃ§in.');
        return;
    }
    setLoading(true);
    
    const observationData = {
      child_id: childId,
      note,
      domains,
      context,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
      if (isEditMode) {
        await updateObservation(observationToEdit.id, observationData);
      } else {
        const created = await addObservation(observationData, user.id);
        // If online, run AI analysis and persist assessment in the background (non-blocking)
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
            } catch (aiErr) {
              console.error('AI analysis failed (background):', aiErr);
            }
          })();
        }
      }
      navigate('child-detail', { id: childId });
    } catch (error) {
      console.error(error);
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
          <div className="mt-1 relative">
            <textarea 
              id="note" 
              rows={6}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md pr-12"
              placeholder={t('notePlaceholder')}
              required
            />
            <button
              type="button"
              onClick={toggleRecording}
              title={sttSupported ? (isRecording ? 'Durdur' : 'Mikrofonu BaÅŸlat') : 'iOS/Safari: Ses dosyasÄ± seÃ§ilecek'}
              className={`absolute right-2 bottom-2 px-2.5 py-1.5 rounded-md text-sm border ${isRecording ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 text-gray-800'}`}
            >
              {isRecording ? 'â€¢' : 'ğŸ™ï¸'}
            </button>
            
          </div>
          {isRecording && sessionTranscript && (
            <div className="mt-1 text-xs text-gray-500">AnlÄ±k: {sessionTranscript}</div>
          )}
          {!sttSupported && (
            <div className="mt-1 text-xs text-amber-700">TarayÄ±cÄ± STT desteklemiyor. Mikrofon simgesine tÄ±klayÄ±nca ses dosyasÄ± seÃ§ilir ve sunucu tarafÄ±nda Ã§Ã¶zÃ¼mlenir.</div>
          )}
          {isTranscribing && (
            <div className="mt-1 text-xs text-gray-500">Ses dosyasÄ± Ã§Ã¶zÃ¼mleniyorâ€¦</div>
          )}
        </div>

        <div>
            <h3 className="text-sm font-medium text-gray-700">{t('developmentDomains')}</h3>
            <p className="text-xs text-gray-500 mb-2">{t('selectDomains')}</p>
            <div className="flex flex-wrap gap-2">
                {Object.keys(DEVELOPMENT_DOMAINS).map(key => {
                    const domain = key as DevelopmentDomain;
                    const isSelected = domains.includes(domain);
                    return (
                        <button type="button" key={domain} onClick={() => handleDomainToggle(domain)} className={`px-3 py-1.5 text-sm rounded-full border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700'}`}>
                            {DEVELOPMENT_DOMAINS[domain]}
                        </button>
                    )
                })}
            </div>
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700">{t('context')}</label>
          <select id="context" value={context} onChange={e => setContext(e.target.value as ObservationContext)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            {Object.keys(OBSERVATION_CONTEXTS).map(key => (
              <option key={key} value={key}>{OBSERVATION_CONTEXTS[key as ObservationContext]}</option>
            ))}
          </select>
        </div>

        <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">{t('tags')}</label>
            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" placeholder={t('tagsPlaceholder')} />
        </div>

        <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('child-detail', {id: childId})} className="px-4 py-2 bg-gray-200 rounded-md">{t('cancel')}</button>
            <button type="submit" disabled={loading || domains.length === 0} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">
                {loading ? t('loading') : t('save')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ObservationScreen;





