import { supabase } from '../supabase';
import { Goal, GoalStatus, GoalPriority, DevelopmentDomain } from '../../types';
import {
  setCache,
  getCache,
  addToOfflineQueue,
  isOnline,
  CACHED_GOALS_KEY,
  dispatchDataChangedEvent,
} from './common';

export const getGoalsByChild = async (childId: string): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const result = (data || []) as Goal[];
    // Cache'e kaydet
    setCache(`${CACHED_GOALS_KEY}_${childId}`, result);
    return result;
  } catch (error) {
    // Offline ise cache'den dön
    if (!isOnline()) {
      const cached = getCache<Goal[]>(`${CACHED_GOALS_KEY}_${childId}`);
      if (cached) return cached;
      return []; // Boş döndür
    }
    throw error;
  }
};

export const getGoalById = async (goalId: string): Promise<Goal | null> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();
  
  if (error) throw error;
  return data as Goal;
};

export const createGoal = async (
  childId: string,
  userId: string,
  title: string,
  domain: DevelopmentDomain,
  options?: {
    description?: string;
    priority?: GoalPriority;
    target_date?: string;
    notes?: string;
  }
): Promise<Goal> => {
  const goalData = {
    child_id: childId,
    user_id: userId,
    title,
    domain,
    description: options?.description,
    priority: options?.priority || 'medium',
    target_date: options?.target_date,
    notes: options?.notes,
    status: 'not_started' as GoalStatus,
    progress: 0,
  };
  
  // Offline ise queue'ya ekle
  if (!isOnline()) {
    addToOfflineQueue({
      type: 'goal',
      action: 'create',
      data: goalData,
    });
    
    // Temporary local record
    const tempGoal = {
      id: `temp_${Date.now()}`,
      ...goalData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Goal;
    
    dispatchDataChangedEvent();
    return tempGoal;
  }
  
  const { data, error } = await supabase
    .from('goals')
    .insert(goalData)
    .select()
    .single();
  
  if (error) throw error;
  dispatchDataChangedEvent();
  return data as Goal;
};

export const updateGoal = async (
  goalId: string,
  updates: {
    title?: string;
    description?: string;
    status?: GoalStatus;
    priority?: GoalPriority;
    target_date?: string;
    progress?: number;
    notes?: string;
  }
): Promise<Goal> => {
  const updateData: any = { ...updates };
  
  // If status is being set to completed, set completed_at
  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.progress = 100;
  }
  
  // Offline ise queue'ya ekle
  if (!isOnline()) {
    addToOfflineQueue({
      type: 'goal_update',
      action: 'update',
      data: { id: goalId, ...updateData },
    });
    
    dispatchDataChangedEvent();
    // Return a mock goal (ideally we'd retrieve from cache)
    return { id: goalId, ...updateData } as Goal;
  }
  
  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .select()
    .single();
  
  if (error) throw error;
  dispatchDataChangedEvent();
  return data as Goal;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);
  
  if (error) throw error;
};

export const getGoalsByUser = async (userId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Goal[];
};

export const getActiveGoalsByChild = async (childId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('child_id', childId)
    .in('status', ['not_started', 'in_progress'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Goal[];
};

