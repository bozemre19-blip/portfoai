import { supabase } from '../supabase';
import { Goal, GoalStatus, GoalPriority, DevelopmentDomain } from '../../types';

export const getGoalsByChild = async (childId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Goal[];
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
  const { data, error } = await supabase
    .from('goals')
    .insert({
      child_id: childId,
      user_id: userId,
      title,
      domain,
      description: options?.description,
      priority: options?.priority || 'medium',
      target_date: options?.target_date,
      notes: options?.notes,
      status: 'not_started',
      progress: 0,
    })
    .select()
    .single();
  
  if (error) throw error;
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
  
  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .select()
    .single();
  
  if (error) throw error;
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

