import { supabase } from './supabase';
import type { Child, Observation, Assessment, OfflineObservation, DevelopmentDomain, Media, RiskLevel, ObservationContext } from '../types';
import { processImage } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { t } from '../constants.clean';

const OFFLINE_OBSERVATIONS_KEY = 'offlineObservations';

const dispatchDataChangedEvent = () => window.dispatchEvent(new Event('datachanged'));

// ---- Classes API (optional table: public.classes) ----
export type ClassItem = { id: string; user_id: string; name: string; slug: string; created_at: string };

const makeSlug = (name: string) =>
  (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('tr-TR');

const normalizeClassName = (name: string) =>
  (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (s) => s.toLocaleUpperCase('tr-TR'));

export const getClasses = async (userId: string): Promise<ClassItem[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) {
    // If table doesn't exist, surface a clearer message
    if ((error as any).message?.includes('relation') && (error as any).message?.includes('does not exist')) {
      throw new Error("'classes' tablosu bulunamadÄ±. LÃ¼tfen Supabase'de sÄ±nÄ±flar iÃ§in tabloyu oluÅŸturun.");
    }
    throw error;
  }
  return (data || []) as ClassItem[];
};

export const createClass = async (userId: string, name: string): Promise<ClassItem> => {
  const pretty = normalizeClassName(name);
  const slug = makeSlug(pretty);
  // Try upsert with onConflict if unique index exists; otherwise fallback to manual check
  let { data, error } = await supabase
    .from('classes')
    .upsert({ user_id: userId, name: pretty, slug }, { onConflict: 'user_id,slug' })
    .select()
    .single();
  if (error) {
    // Fallback path
    const { data: exists } = await supabase.from('classes').select('*').eq('user_id', userId).eq('slug', slug).single();
    if (exists) return exists as ClassItem;
    const ins = await supabase.from('classes').insert({ user_id: userId, name: pretty, slug }).select().single();
    if (ins.error) throw ins.error;
    data = ins.data as any;
  }
  dispatchDataChangedEvent();
  return data as ClassItem;
};

// Child API
export const getChildren = async (userId: string) => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Child[];
};

// Faster classroom-scoped query: fetch only necessary columns for this class
export const getChildrenByClassroom = async (userId: string, classroom: string) => {
    const { data, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, classroom, photo_url, dob')
      .eq('user_id', userId)
      .eq('classroom', classroom)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Pick<Child,'id'|'first_name'|'last_name'|'classroom'|'photo_url'|'dob'>[] as Child[];
};

export const addChild = async (child: Omit<Child, 'id' | 'user_id' | 'created_at'>, userId: string) => {
    const { data, error } = await supabase.from('children').insert({ ...child, user_id: userId }).select();
    if (error) throw error;
    dispatchDataChangedEvent();
    return data[0] as Child;
};

export const updateChild = async (childId: string, updates: Partial<Child>) => {
    const { data, error } = await supabase.from('children').update(updates).eq('id', childId).select().single();
    if (error) throw error;
    dispatchDataChangedEvent();
    return data as Child;
};

export const deleteChild = async (childId: string) => {
    // 1. Ä°liÅŸkili medya ve fotoÄŸraf yollarÄ±nÄ± silmeden Ã–NCE al
    const { data: mediaToDelete, error: mediaError } = await supabase
        .from('media')
        .select('storage_path')
        .eq('child_id', childId);

    if (mediaError) {
        console.error('Silinecek medya alÄ±nÄ±rken hata oluÅŸtu:', mediaError);
    }

    const { data: childData, error: childError } = await supabase
        .from('children')
        .select('photo_url')
        .eq('id', childId)
        .single();
        
    if (childError) {
        console.error('FotoÄŸrafÄ± silmek iÃ§in Ã§ocuk verisi alÄ±nÄ±rken hata oluÅŸtu:', childError);
    }

    // 2. DosyalarÄ± depolama alanÄ±ndan sil
    if (mediaToDelete && mediaToDelete.length > 0) {
        const paths = mediaToDelete.map(m => m.storage_path);
        const { error: storageMediaError } = await supabase.storage.from('child-media').remove(paths);
        if (storageMediaError) {
            console.error('Medya depolama alanÄ±ndan silinirken hata:', storageMediaError);
        }
    }

    if (childData?.photo_url) {
        try {
            const url = new URL(childData.photo_url);
            const path = url.pathname.split('/avatars/')[1];
            if (path) {
                const { error: storageAvatarError } = await supabase.storage.from('avatars').remove([path]);
                 if (storageAvatarError) {
                    console.error('Avatar depolama alanÄ±ndan silinirken hata:', storageAvatarError);
                }
            }
        } catch(e) {
            console.error("Depolama alanÄ±ndan silmek iÃ§in fotoÄŸraf URL'si ayrÄ±ÅŸtÄ±rÄ±lamadÄ±", e);
        }
    }

    // 3. Ã‡ocuk kaydÄ±nÄ± veritabanÄ±ndan sil. Bu iÅŸlem gÃ¶zlemleri vb. basamaklÄ± olarak silecektir.
    const { error: deleteError } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

    if (deleteError) {
        console.error('Ã‡ocuk veritabanÄ±ndan silinirken hata:', deleteError);
        throw deleteError;
    }

    // 4. ArayÃ¼zÃ¼ yenilemek iÃ§in olayÄ± tetikle
    dispatchDataChangedEvent();
};

// ---------------- Chat Assistant persistence ----------------
export type ChatThread = {
  id: string;
  user_id: string;
  title: string;
  mode: 'general'|'class'|'child';
  classroom?: string | null;
  child_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user'|'assistant'|'system';
  content: string;
  created_at: string;
};

export const listChatThreads = async (userId: string): Promise<ChatThread[]> => {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ChatThread[];
};

export const createChatThread = async (args: {
  userId: string; title: string; mode: 'general'|'class'|'child'; classroom?: string; childId?: string;
}): Promise<ChatThread> => {
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({ user_id: args.userId, title: args.title, mode: args.mode, classroom: args.classroom, child_id: args.childId })
    .select()
    .single();
  if (error) throw error;
  return data as ChatThread;
};

export const getChatMessages = async (threadId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ChatMessage[];
};

export const addChatMessage = async (args: {
  threadId: string; userId: string; role: 'user'|'assistant'|'system'; content: string;
}): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ thread_id: args.threadId, user_id: args.userId, role: args.role, content: args.content })
    .select()
    .single();
  if (error) throw error;
  // touch thread updated_at
  await supabase.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', args.threadId);
  return data as ChatMessage;
};

// ---- Teacher Assistant (Edge Function) ----
export const askTeacherAssistant = async (args: {
  message: string;
  mode?: 'general'|'class'|'child';
  classroom?: string;
  childId?: string;
  history?: { role: 'user'|'assistant'|'system'; content: string; at?: string }[];
}) => {
  const { data, error } = await (supabase as any).functions.invoke('teacher_chat', { body: args });
  if (error) throw error;
  return data as { reply: string; used_model?: string; provider_error?: string };
};


// Observation API
export const getObservationsForChild = async (childId: string) => {
    const { data, error } = await supabase
        .from('observations')
        .select('*, assessments(*)')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    // Normalize nested assessments (Supabase returns array)
    const normalized = (data || []).map((row: any) => {
        let items = row.assessments;
        if (Array.isArray(items) && items.length > 0) {
            // Pick the newest assessment by created_at (fallback to last item)
            const picked = [...items].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            return { ...row, assessments: picked };
        }
        return { ...row, assessments: null };
    });
    // Combine offline
    const localObservations = getOfflineObservations().filter(o => o.child_id === childId);
    return [...localObservations, ...normalized] as (Observation & { assessments: Assessment | null })[];
};

export const addObservation = async (observation: Omit<Observation, 'id'|'user_id'|'created_at'|'updated_at'>, userId: string, mediaFiles?: { file: File, name: string }[]) => {
    if (!navigator.onLine) {
        return addObservationOffline(observation, mediaFiles);
    }
    
    let media_ids: string[] | undefined;
    if (mediaFiles && mediaFiles.length > 0) {
        // In a real app, you'd upload and get IDs. Here we just note the attempt.
        // For simplicity, we are not implementing the full media upload in this snippet.
        console.log("Media files would be uploaded here.");
    }
    
    const { data, error } = await supabase.from('observations').insert({ ...observation, user_id: userId, media_ids }).select();
    if (error) throw error;
    dispatchDataChangedEvent();
    return data[0] as Observation;
};

export const updateObservation = async (observationId: string, updates: Partial<Observation>) => {
    const { data, error } = await supabase.from('observations').update(updates).eq('id', observationId).select();
    if (error) throw error;
    dispatchDataChangedEvent();
    return data[0] as Observation;
};

export const deleteObservation = async (observationId: string) => {
    // Ã–nce iliÅŸkili deÄŸerlendirmeleri (AI Analizleri) sil.
    // Bu, ON DELETE CASCADE ile RLS arasÄ±ndaki olasÄ± sorunlarÄ± Ã¶nler.
    const { error: assessmentError } = await supabase
        .from('assessments')
        .delete()
        .eq('observation_id', observationId);

    if (assessmentError) {
        console.error('Error deleting associated assessment:', assessmentError);
        throw assessmentError;
    }

    // ArdÄ±ndan gÃ¶zlemin kendisini sil.
    const { error: observationError } = await supabase
        .from('observations')
        .delete()
        .eq('id', observationId);

    if (observationError) {
        console.error('Error deleting observation:', observationError);
        throw observationError;
    }
    dispatchDataChangedEvent();
};

// AI Analysis
export const getAiAnalysis = async (observationNote: string, domains: DevelopmentDomain[]): Promise<Assessment> => {
    const { data, error } = await supabase.functions.invoke('ai_evaluate', {
        body: { observationNote, domains },
    });
    if (error) throw error;
    return data.assessment as Assessment;
};

// Class-level AI suggestions: aggregate recent observations/assessments and ask the AI for class-wide advice
export const getClassAiSuggestions = async (
  userId: string,
  opts: { days?: number; maxObservations?: number; childIds?: string[]; domains?: DevelopmentDomain[]; risks?: RiskLevel[] } = {}
): Promise<{ suggestions: string[]; summary?: string }> => {
  const days = opts.days ?? 30;
  const maxObservations = opts.maxObservations ?? 40;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  // Pull a window of recent observations with embedded assessments
  let query = supabase
    .from('observations')
    .select('child_id, note, domains, created_at, assessments(risk, suggestions, domain_scores)')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(maxObservations);
  if (opts.childIds && opts.childIds.length > 0) {
    query = query.in('child_id', opts.childIds as any);
  }
  const { data, error } = await query;
  if (error) throw error;

  let observations = (data || []) as any[];
  // Apply optional filters
  if (opts.domains && opts.domains.length > 0) {
    const set = new Set(opts.domains);
    observations = observations.filter((row: any) => Array.isArray(row?.domains) && row.domains.some((d: string) => set.has(d)));
  }
  if (opts.risks && opts.risks.length > 0) {
    const rset = new Set(opts.risks);
    observations = observations.filter((row: any) => {
      const a = Array.isArray(row?.assessments) && row.assessments.length > 0 ? row.assessments[0] : undefined;
      return a?.risk ? rset.has(a.risk) : false;
    });
  }
  const domainSet = new Set<DevelopmentDomain>();
  const domainCounts: Record<string, number> = {};
  let riskLow = 0, riskMed = 0, riskHigh = 0;
  const suggestionPool: string[] = [];
  for (const row of observations) {
    const doms: DevelopmentDomain[] = Array.isArray(row?.domains) ? row.domains : [];
    for (const d of doms) { domainSet.add(d); domainCounts[d] = (domainCounts[d] || 0) + 1; }
    const assessment = Array.isArray(row?.assessments) && row.assessments.length > 0 ? row.assessments[0] : undefined;
    const r = assessment?.risk as string | undefined;
    if (r === 'high') riskHigh++; else if (r === 'medium') riskMed++; else if (r === 'low') riskLow++;
    const sugArr: string[] = Array.isArray(assessment?.suggestions) ? assessment!.suggestions : [];
    for (const s of sugArr) { if (typeof s === 'string' && s.trim()) suggestionPool.push(s.trim()); }
  }

  // Build a summarization-focused note for the AI
  const domains = Array.from(domainSet);
  const topDomainLines = Object.entries(domainCounts)
    .sort((a,b) => (b[1] - a[1]))
    .map(([k,v]) => `- ${k}: ${v}`)
    .join('\n');
  const riskLine = `Low:${riskLow}, Medium:${riskMed}, High:${riskHigh}`;
  const suggestionsList = suggestionPool.map(s => `- ${s}`).join('\n');

  const aggregateText = [
    `SÄ±nÄ±f Ã–zeti (son ${days} gÃ¼n):`,
    `Risk DaÄŸÄ±lÄ±mÄ±: ${riskLine}`,
    `Alan DaÄŸÄ±lÄ±mÄ±:\n${topDomainLines || '-'}`,
    '',
    'Bireysel Ã–ÄŸrenci Ã–nerileri Listesi (AI bunu Ã–ZETLEYÄ°P sÄ±nÄ±f dÃ¼zeyine Ã§Ä±karsÄ±n):',
    suggestionsList || '- Veri yok',
    '',
    'Talimat: Bu tek tek Ã¶ÄŸrenci Ã¶nerilerini analiz et, tekrarlarÄ± kaldÄ±r, temalarÄ± birleÅŸtir ve sÄ±nÄ±f genelinde uygulanabilir 6â€“10 maddelik bir Ã¶neri listesi Ã§Ä±kar. KÄ±sa, eyleme geÃ§irilebilir cÃ¼mleler yaz. YalnÄ±zca sÄ±nÄ±f dÃ¼zeyinde konuÅŸ, bireylerden bahsetme. Ã‡IKTI JSON olsun (summary, suggestions).'
  ].join('\n');

  try {
    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai_evaluate', {
      body: { observationNote: aggregateText, domains },
    });
    if (aiError) throw aiError;
    const assessment = aiData?.assessment as Assessment | undefined;
    return {
      suggestions: Array.isArray(assessment?.suggestions) ? assessment!.suggestions : [],
      summary: assessment?.summary,
    };
  } catch (e) {
    // Fallback: deduplicate top suggestions from assessments in DB
    const set = new Set<string>();
    for (const row of observations) {
      const sug = Array.isArray(row?.assessments?.[0]?.suggestions) ? row.assessments[0].suggestions : [];
      for (const s of sug || []) { if (typeof s === 'string' && s.trim()) set.add(s.trim()); }
      if (set.size >= 10) break;
    }
    return { suggestions: Array.from(set).slice(0, 10) };
  }
};

// Save AI analysis result and link to observation
export const addAssessmentForObservation = async (
    observationId: string,
    userId: string,
    analysis: { summary: string; risk: RiskLevel; suggestions: string[]; domain_scores: Partial<Record<DevelopmentDomain, number>> }
) => {
    const payload = {
        observation_id: observationId,
        user_id: userId,
        summary: analysis.summary,
        risk: analysis.risk,
        suggestions: analysis.suggestions,
        domain_scores: analysis.domain_scores,
    };
    // Upsert ensures re-running analysis overwrites the previous one for the same observation
    let { data, error } = await supabase
        .from('assessments')
        .upsert(payload, { onConflict: 'observation_id' })
        .select()
        .single();
    if (error) {
        // Fallback: delete old then insert new (handles missing unique index cases)
        await supabase.from('assessments').delete().eq('observation_id', observationId);
        const insertRes = await supabase.from('assessments').insert(payload).select().single();
        if (insertRes.error) throw insertRes.error;
        data = insertRes.data as any;
    }
    dispatchDataChangedEvent();
    return data as Assessment;
};


// Offline Functionality
const getOfflineObservations = (): OfflineObservation[] => {
    try {
        const data = localStorage.getItem(OFFLINE_OBSERVATIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const saveOfflineObservations = (observations: OfflineObservation[]) => {
    localStorage.setItem(OFFLINE_OBSERVATIONS_KEY, JSON.stringify(observations));
};

const addObservationOffline = async (
    observation: Omit<Observation, 'id'|'user_id'|'created_at'|'updated_at'>,
    mediaFiles?: { file: File, name: string }[]
) => {
    const offlineObservations = getOfflineObservations();
    const newOfflineObservation: OfflineObservation = {
        ...observation,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        dirty: true,
        media_files: mediaFiles
    };
    
    saveOfflineObservations([...offlineObservations, newOfflineObservation]);
    dispatchDataChangedEvent();
    alert(t('observationSavedOffline'));
    return newOfflineObservation;
};

export const syncOfflineData = async () => {
    const offlineObservations = getOfflineObservations();
    if (offlineObservations.length === 0) return;

    const session = await supabase.auth.getSession();
    const userId = session?.data.session?.user.id;

    if (!userId) {
        console.error("User not logged in, cannot sync.");
        return;
    }

    let successCount = 0;
    const remainingObservations: OfflineObservation[] = [];

    for (const obs of offlineObservations) {
        try {
            // Simplified: does not include media sync for brevity
            const { media_files, dirty, id, ...obsToSync } = obs;
            await supabase.from('observations').insert({ ...obsToSync, user_id: userId });
            successCount++;
        } catch (error) {
            console.error('Failed to sync observation:', obs.id, error);
            remainingObservations.push(obs);
        }
    }
    
    saveOfflineObservations(remainingObservations);

    if (successCount > 0) {
        alert(`${successCount} ${t('observationsSynced')}`);
        window.dispatchEvent(new Event('datachanged'));
    }
};

// Media API
export const getMediaForChild = async (childId: string) => {
    const { data, error } = await supabase.from('media').select('*').eq('child_id', childId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Media[];
};

export const addMediaRecord = async (media: Omit<Media, 'id' | 'user_id' | 'created_at'>, userId: string) => {
    const { data, error } = await supabase.from('media').insert({ ...media, user_id: userId }).select();
    if (error) throw error;
    dispatchDataChangedEvent();
    return data[0] as Media;
};

export const deleteMedia = async (mediaItem: Media) => {
    // 1. Attempt to delete from storage.
    const { error: storageError } = await supabase.storage.from('child-media').remove([mediaItem.storage_path]);
    
    // If an error occurs during storage deletion (e.g., file not found), we log it but don't
    // throw, because the primary goal is to remove the database record to keep the UI consistent.
    if (storageError) {
        console.error(`Storage deletion failed for path "${mediaItem.storage_path}", but proceeding to delete database record. Storage error:`, storageError.message);
    }
    
    // 2. Delete from database. This is the critical step.
    const { error: dbError } = await supabase.from('media').delete().eq('id', mediaItem.id);
    if (dbError) throw dbError;
    dispatchDataChangedEvent();
};

// Signed URL for private child-media bucket
export const getSignedUrlForMedia = async (storagePath: string, expiresInSeconds = 3600): Promise<string> => {
    const { data, error } = await supabase.storage.from('child-media').createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
};

export const updateMediaViaFunction = async (
  mediaId: string,
  childId: string,
  fields: { name?: string; description?: string; domain?: DevelopmentDomain; file?: File }
): Promise<{ path: string }> => {
  let dataUrl: string | undefined;
  let fileType: string | undefined;
  let fileName: string | undefined;
  if (fields.file) {
    const reader = new FileReader();
    dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fields.file as File);
    });
    fileType = fields.file.type;
    fileName = fields.file.name;
  }
  const payload: any = {
    mediaId,
    childId,
    name: fields.name,
    description: fields.description,
    domain: fields.domain,
  };
  if (dataUrl) Object.assign(payload, { data: dataUrl, fileType, fileName });

  const { data, error } = await supabase.functions.invoke('media_update', { body: payload });
  if (error) throw new Error(error.message || 'Update failed');
  return { path: (data as any)?.path };
};


// Media Upload
export const uploadMedia = async (userId: string, childId: string, file: File): Promise<string> => {
    const processedFile = await processImage(file);
    const extFromType = processedFile.type?.split('/')[1] || '';
    const extFromName = processedFile.name.includes('.') ? processedFile.name.split('.').pop() : '';
    const ext = (extFromType || extFromName || 'jpg').toLowerCase();
    const fileName = `${userId}/${childId}/${uuidv4()}.${ext}`;
    const { data, error } = await supabase.storage.from('child-media').upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: processedFile.type || 'image/jpeg',
    });
    if (error) throw error;
    return data.path;
};

// Upload via Edge Function (bypasses client-side Storage RLS)
const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const uploadMediaViaFunction = async (
  childId: string,
  file: File,
  fields: { name: string; description?: string; domain?: DevelopmentDomain }
): Promise<{ path: string }> => {
  const dataUrl = await fileToBase64(file);
  const payload = {
    childId,
    name: fields.name,
    description: fields.description,
    domain: fields.domain,
    fileName: file.name,
    fileType: file.type,
    data: dataUrl,
  };
  const { data, error } = await supabase.functions.invoke('media_upload', {
    body: payload,
  });
  if (error) throw new Error(error.message || 'Upload failed');
  return { path: (data as any)?.path };
};

// Server-side ASR kaldÄ±rÄ±ldÄ±

export const uploadChildPhoto = async (userId: string, childId: string, file: File): Promise<string> => {
    const processedFile = await processImage(file);
    const fileName = `${userId}/${childId}/${uuidv4()}`;
    
    // Not: Bu fonksiyon 'avatars' adÄ±nda halka aÃ§Ä±k bir bucket olduÄŸunu varsayar.
    // Supabase projenizde bu bucket'Ä± oluÅŸturup public olarak ayarlamanÄ±z gerekebilir.
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: true
    });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path);

    return publicUrlData.publicUrl;
};

// Data Export
export const exportChildData = async (childId: string) => {
    const { data: childData, error: childError } = await supabase.from('children').select('*').eq('id', childId).single();
    if(childError) throw childError;
    
    const { data: observations, error: obsError } = await supabase.from('observations').select('*, assessments(*)').eq('child_id', childId);
    if(obsError) throw obsError;

    const exportData = {
        child: childData,
        observations: observations,
    };
    // Safer filename (ASCII) in case of special characters
    const slug = (s: string) => s.normalize('NFD').replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    const filename = `export_${slug(childData.first_name || 'cocuk')}_${slug(childData.last_name || 'veri')}_${new Date().toISOString().split('T')[0]}.json`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        // As a fallback, also try opening in a new tab (some environments block download)
        setTimeout(() => {
            try { window.open(url, '_blank'); } catch { /* noop */ }
            URL.revokeObjectURL(url);
        }, 200);
    }
};

// ---------------- Demo Data Seeder ----------------
export type SeedOptions = {
  classNames?: string[];
  classes?: number;
  childrenPerClass?: number;
  observationsPerChild?: number;
  mediaPerChild?: number;
  onProgress?: (msg: string) => void;
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const turkishFirstNames = ['Emir','Ali','Eymen','Mert','Kerem','Aras','Deniz','Atlas','Can','Yiğit','Eylül','Zeynep','Elif','Defne','Asel','Naz','Mira','Ada','Ecrin','Lina'];
const turkishLastNames = ['Yılmaz','Demir','Şahin','Çelik','Yıldız','Yıldırım','Öztürk','Aydın','Arslan','Doğan','Kaya','Koç','Polat','Işık','Uzun'];
const sampleNotes = [
  'Serbest oyunda bloklarla kule kurdu, sabırla denedi.',
  'Hikaye saatinde aktif katılım gösterdi ve sorulara cevap verdi.',
  'Bahçede top yakalama oyununda sıra bekledi ve kurallara uydu.',
  'Makas kullanırken baş parmak pozisyonunu düzeltti.',
  'Arkadaşına oyuncak paylaşımı yaptı ve teşekkür etti.',
  'Müzik etkinliğinde ritme uygun tempo tuttu.',
  'Görseldeki nesneleri isimlendirirken sesleri doğru çıkardı.',
];

// More diverse, composable observation generator
const ctxText: Record<ObservationContext, string> = {
  classroom: 'sınıf içinde',
  outdoor: 'bahçede',
  home: 'ev ortamında',
  other: 'etkinlik sırasında',
};

const domainActivities: Record<DevelopmentDomain, string[]> = {
  cognitive: [
    'eşleştirme oyununda doğru bağlantılar kurdu',
    'yapboz parçalarını stratejik olarak yerleştirdi',
    'renk/şekil sınıflama görevini başarıyla tamamladı',
    '3 adımlı yönergeyi bağımsız takip etti',
  ],
  language: [
    'hikâyedeki olayları kendi sözleriyle özetledi',
    'görsellerden çıkarım yaparak soruları yanıtladı',
    'yeni kelimeleri cümle içinde kullanmayı denedi',
    'akranıyla sohbeti başlatıp sürdürdü',
  ],
  social_emotional: [
    'sıra beklerken sabırlı davrandı',
    'arkadaşına materyal uzatarak iş birliği yaptı',
    'duygusunu sözel olarak ifade etti',
    'oyunda basit çatışmayı konuşarak çözdü',
  ],
  fine_motor: [
    'makasla çizgi boyunca dikkatle kesti',
    'boncukları ipe geçirirken iki el koordinasyonu kullandı',
    'kalemi üç parmak kavrayışla tuttu ve çizgileri takip etti',
    'lego parçalarıyla küçük bir model oluşturdu',
  ],
  gross_motor: [
    'topu hedefe doğru gönderdi ve yakaladı',
    'denge tahtasında kontrollü yürüdü',
    'sek sek oyununda dengesini korudu',
    'zıplama ve çömelme hareketlerini ritme uygun yaptı',
  ],
  self_care: [
    'ellerini adım adım doğru yıkadı',
    'giyinme sırasında fermuarını kapatmayı denedi',
    'yemek öncesi masayı hazırlamada sorumluluk aldı',
    'oyun sonrası materyalleri yerine yerleştirdi',
  ],
};

const adverbs = ['dikkatle', 'hevesle', 'sakin bir şekilde', 'kısa hatırlatma ile', 'bağımsız'];
const closers = [
  'Süre boyunca odağını korudu.',
  'Modelleme sonrasında denemeye devam etti.',
  'Akran desteğiyle görevi tamamladı.',
  'Önceki haftaya göre daha uzun süre katılım sağladı.',
];

const pickManyUnique = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const makeObservationNote = (fullName: string, domains: DevelopmentDomain[], context: ObservationContext): string => {
  const parts: string[] = [];
  const ctx = ctxText[context] || 'etkinlikte';
  const dom = pick(domains);
  const act = pick(domainActivities[dom]);
  const adv = pick(adverbs);
  parts.push(`${ctx} ${act} (${adv}).`);
  if (Math.random() < 0.6) parts.push(pick(closers));
  if (Math.random() < 0.4) parts.unshift(`${fullName} bugün gözlemlendi.`);
  return parts.join(' ');
};

const domainList: DevelopmentDomain[] = ['cognitive','language','social_emotional','fine_motor','gross_motor','self_care'];
const contextList: ObservationContext[] = ['classroom','outdoor','home','other'];

const makeDob = (): string => {
  // 3-6 yaş aralığı
  const now = new Date();
  const year = now.getFullYear() - rand(3, 6);
  const month = rand(1, 12);
  const day = rand(1, 28);
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
};

const makeImageFile = async (text: string, bg = '#e0f2fe', fg = '#1e293b'): Promise<File> => {
  const canvas = document.createElement('canvas');
  const w = 640, h = 420;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // background
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  // accent shape
  ctx.fillStyle = '#10b981'; ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(w-80, 80, 60, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
  // text
  ctx.fillStyle = fg; ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(text, 32, 120);
  ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText('PortfoAI · Demo', 32, 160);
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('blob failed'));
      resolve(new File([blob], 'demo.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
    }, 'image/jpeg', 0.9);
  });
};

type SeedRecord = { time: string; classes: string[]; children: string[]; observations: string[]; media: string[] };

export const seedDemoData = async (userId: string, opts: SeedOptions = {}) => {
  const log = (m: string) => { console.log('[seed]', m); opts.onProgress?.(m); };
  const classes = (opts.classNames && opts.classNames.length > 0
    ? opts.classNames
    : Array.from({ length: opts.classes ?? 2 }, (_, i) => i === 0 ? 'Sınıf A' : i === 1 ? 'Sınıf B' : `Sınıf ${i+1}`)
  ).slice(0, 5);
  const perClass = opts.childrenPerClass ?? 15;
  const obsPerChild = opts.observationsPerChild ?? 7;
  const mediaPerChild = opts.mediaPerChild ?? 2;
  const record: SeedRecord = { time: new Date().toISOString(), classes: [], children: [], observations: [], media: [] };

  log(`Sınıflar: ${classes.join(', ')}`);
  // Create classes (table optional)
  for (const name of classes) {
    try { const c = await createClass(userId, name); record.classes.push(c.id); } catch { /* ignore */ }
  }

  for (const className of classes) {
    log(`${className} için ${perClass} çocuk oluşturuluyor...`);
    for (let i = 0; i < perClass; i++) {
      const first = pick(turkishFirstNames);
      const last = pick(turkishLastNames);
      const childPayload: Omit<Child,'id'|'user_id'|'created_at'> = {
        first_name: first,
        last_name: last,
        dob: makeDob(),
        photo_url: undefined,
        classroom: className,
        consent_obtained: true,
        guardians: undefined,
        health: undefined,
        interests: undefined,
        strengths: undefined,
      } as any;
      let child: Child;
      try {
        child = await addChild(childPayload, userId);
        record.children.push(child.id);
      } catch (e) {
        console.error('Child insert failed', e);
        continue;
      }

      // Media
      for (let m = 0; m < mediaPerChild; m++) {
        try {
          const file = await makeImageFile(`${first} ${last} · Ürün ${m+1}`);
          const path = await uploadMedia(userId, child.id, file);
          const mediaRow = await addMediaRecord({
            child_id: child.id,
            type: 'image',
            storage_path: path,
            name: `Ürün ${m+1}`,
            description: 'Demo ürünü',
            domain: pick(domainList),
          }, userId);
          record.media.push((mediaRow as any).id);
        } catch (e) {
          console.warn('Media upload skipped:', e);
        }
      }

      // Observations (diverse generation)
      for (let k = 0; k < obsPerChild; k++) {
        const dCount = rand(1,3);
        const domains = pickManyUnique(domainList, dCount);
        const context = pick(contextList);
        const note = makeObservationNote(`${first} ${last}`, domains, context);
        const extraTagsPool = ['oyun','kitap','bahçe','müzik','sanat','ritim','paylaşım','ince-motor','kaba-motor'];
        const tagCount = rand(2,3);
        const tags = ['demo', ...pickManyUnique(extraTagsPool, tagCount)];
        try {
          const created = await addObservation({
            child_id: child.id,
            note,
            context,
            domains,
            tags,
          } as any, userId);
          if (created && (created as any).id) record.observations.push((created as any).id);
        } catch (e) {
          console.warn('Observation insert skipped:', e);
        }
      }
    }
  }
  log('Demo verisi oluşturma tamamlandı.');
  try { localStorage.setItem('lastSeedRecord', JSON.stringify(record)); } catch {}
};

export const removeDemoData = async (userId: string, opts: { aggressive?: boolean; days?: number; onProgress?: (m:string)=>void } = {}) => {
  const say = (m:string) => { console.log('[seed:revert]', m); opts.onProgress?.(m); };
  const recordRaw = (()=>{ try { return localStorage.getItem('lastSeedRecord'); } catch { return null; }})();
  const record: SeedRecord | null = recordRaw ? JSON.parse(recordRaw) : null;

  // 1) Observations (batch)
  try {
    let obsIds: string[] = record?.observations || [];
    if (obsIds.length === 0) {
      const { data } = await supabase
        .from('observations')
        .select('id')
        .eq('user_id', userId)
        .contains('tags', ['demo']);
      obsIds = (data || []).map((r:any)=>r.id);
    }
    if (obsIds.length > 0) {
      say(`Gözlemler siliniyor (${obsIds.length})...`);
      await supabase.from('assessments').delete().in('observation_id', obsIds as any);
      await supabase.from('observations').delete().in('id', obsIds as any);
    }
  } catch (e) { console.warn('Obs revert warn:', e); }

  // 2) Media (batch)
  try {
    let mediaIds: string[] = record?.media || [];
    if (mediaIds.length === 0) {
      const { data } = await supabase
        .from('media')
        .select('id')
        .eq('user_id', userId)
        .eq('description', 'Demo ürünü');
      mediaIds = (data || []).map((r:any)=>r.id);
    }
    if (mediaIds.length > 0) {
      say(`Medya siliniyor (${mediaIds.length})...`);
      const { data: toDel } = await supabase.from('media').select('id, storage_path').in('id', mediaIds as any);
      const paths = (toDel||[]).map((r:any)=>r.storage_path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from('child-media').remove(paths);
      }
      await supabase.from('media').delete().in('id', mediaIds as any);
    }
  } catch (e) { console.warn('Media revert warn:', e); }

  // 3) Children (try exact then heuristic)
  try {
    let childIds: string[] = record?.children || [];
    if (childIds.length === 0) {
      const days = opts.days ?? 14;
      const since = new Date(); since.setDate(since.getDate() - days);
      const { data } = await supabase
        .from('children')
        .select('id, created_at, classroom')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString());
      // Heuristic: Classroom is one of our defaults or child has no non-demo obs/media
      const candidates = (data||[]) as any[];
      if (candidates.length > 0) {
        const classSet = new Set(['Sınıf A','Sınıf B']);
        for (const c of candidates) {
          if (classSet.has(c.classroom)) childIds.push(c.id);
        }
      }
    }
    if (childIds.length > 0) {
      say(`Çocuklar siliniyor (${childIds.length})...`);
      for (const id of childIds) {
        try { await deleteChild(id); } catch (e) { console.warn('child delete warn', e); }
      }
    }
  } catch (e) { console.warn('Children revert warn:', e); }

  // 4) Classes (optional)
  try {
    let classIds: string[] = record?.classes || [];
    if (classIds.length === 0) {
      const { data } = await supabase.from('classes').select('id, name').eq('user_id', userId);
      const list = (data||[]) as any[];
      classIds = list.filter(r => r.name === 'Sınıf A' || r.name === 'Sınıf B').map(r=>r.id);
    }
    if (classIds.length > 0) {
      say('Sınıflar siliniyor...');
      await supabase.from('classes').delete().in('id', classIds as any);
    }
  } catch (e) { console.warn('Classes revert warn:', e); }

  try { localStorage.removeItem('lastSeedRecord'); } catch {}
  dispatchDataChangedEvent();
  say('Demo verisi geri alındı.');
};

