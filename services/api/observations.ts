import { supabase } from '../supabase';
import type { Observation, Assessment, OfflineObservation } from '../../types';
import { dispatchDataChangedEvent, OFFLINE_OBSERVATIONS_KEY } from './common';
import { v4 as uuidv4 } from 'uuid';
import { t } from '../../constants.clean';

// Offline gözlemleri localStorage'dan getir
const getOfflineObservations = (): OfflineObservation[] => {
  try {
    const data = localStorage.getItem(OFFLINE_OBSERVATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Offline gözlemleri localStorage'a kaydet
const saveOfflineObservations = (observations: OfflineObservation[]) => {
  localStorage.setItem(OFFLINE_OBSERVATIONS_KEY, JSON.stringify(observations));
};

// Çevrimdışı gözlem kaydet
const addObservationOffline = async (
  observation: Omit<Observation, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  mediaFiles?: { file: File; name: string }[]
) => {
  const offlineObservations = getOfflineObservations();
  const newOfflineObservation: OfflineObservation = {
    ...observation,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    dirty: true,
    media_files: mediaFiles,
  };

  saveOfflineObservations([...offlineObservations, newOfflineObservation]);
  dispatchDataChangedEvent();
  alert(t('observationSavedOffline'));
  return newOfflineObservation;
};

// Çocuğun tüm gözlemlerini getir (online + offline)
export const getObservationsForChild = async (childId: string) => {
  const { data, error } = await supabase
    .from('observations')
    .select('*, assessments(*)')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Supabase assessments array döner, en güncelini al
  const normalized = (data || []).map((row: any) => {
    let items = row.assessments;
    if (Array.isArray(items) && items.length > 0) {
      const picked = [...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      return { ...row, assessments: picked };
    }
    return { ...row, assessments: null };
  });

  // Offline gözlemleri ekle
  const localObservations = getOfflineObservations().filter((o) => o.child_id === childId);
  return [...localObservations, ...normalized] as (Observation & { assessments: Assessment | null })[];
};

// Yeni gözlem ekle (online veya offline)
export const addObservation = async (
  observation: Omit<Observation, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  userId: string,
  mediaFiles?: { file: File; name: string }[]
) => {
  if (!navigator.onLine) {
    return addObservationOffline(observation, mediaFiles);
  }

  const { data, error } = await supabase
    .from('observations')
    .insert({ ...observation, user_id: userId })
    .select();

  if (error) throw error;
  dispatchDataChangedEvent();
  return data[0] as Observation;
};

// Gözlem güncelle
export const updateObservation = async (observationId: string, updates: Partial<Observation>) => {
  const { data, error } = await supabase
    .from('observations')
    .update(updates)
    .eq('id', observationId)
    .select();

  if (error) throw error;
  dispatchDataChangedEvent();
  return data[0] as Observation;
};

// Gözlem sil (önce assessment'ı sil, sonra gözlemi)
export const deleteObservation = async (observationId: string) => {
  // Önce ilişkili assessment'ları sil (RLS + CASCADE sorunlarını önlemek için)
  const { error: assessmentError } = await supabase
    .from('assessments')
    .delete()
    .eq('observation_id', observationId);

  if (assessmentError) {
    console.error('Assessment silme hatası:', assessmentError);
    throw assessmentError;
  }

  // Ardından gözlemin kendisini sil
  const { error: observationError } = await supabase
    .from('observations')
    .delete()
    .eq('id', observationId);

  if (observationError) {
    console.error('Gözlem silme hatası:', observationError);
    throw observationError;
  }

  dispatchDataChangedEvent();
};

// Offline gözlemleri senkronize et
export const syncOfflineData = async () => {
  const offlineObservations = getOfflineObservations();
  if (offlineObservations.length === 0) return;

  const session = await supabase.auth.getSession();
  const userId = session?.data.session?.user.id;

  if (!userId) {
    console.error('Kullanıcı giriş yapmamış, senkronize edilemiyor.');
    return;
  }

  let successCount = 0;
  const remainingObservations: OfflineObservation[] = [];

  for (const obs of offlineObservations) {
    try {
      // Media dosyaları senkronizasyonu basitleştirilmiş (detaysız)
      const { media_files, dirty, id, ...obsToSync } = obs;
      await supabase.from('observations').insert({ ...obsToSync, user_id: userId });
      successCount++;
    } catch (error) {
      console.error('Gözlem senkronize edilemedi:', obs.id, error);
      remainingObservations.push(obs);
    }
  }

  saveOfflineObservations(remainingObservations);

  if (successCount > 0) {
    alert(`${successCount} ${t('observationsSynced')}`);
    window.dispatchEvent(new Event('datachanged'));
  }
};

