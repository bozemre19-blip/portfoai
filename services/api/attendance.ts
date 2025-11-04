import { supabase } from '../supabase';
import { Attendance, AttendanceStatus, Child } from '../../types';

export const getTodayAttendance = async (userId: string): Promise<Attendance[]> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Attendance[];
};

export const getAttendanceByDate = async (userId: string, date: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Attendance[];
};

export const getAttendanceByChild = async (childId: string, startDate?: string, endDate?: string): Promise<Attendance[]> => {
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('child_id', childId)
    .order('date', { ascending: false });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Attendance[];
};

export const recordAttendance = async (
  childId: string,
  userId: string,
  date: string,
  status: AttendanceStatus,
  notes?: string
): Promise<Attendance> => {
  const checked_in_at = status === 'present' || status === 'late' ? new Date().toISOString() : undefined;
  
  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      child_id: childId,
      user_id: userId,
      date,
      status,
      notes,
      checked_in_at,
    }, {
      onConflict: 'child_id,date'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Attendance;
};

export const bulkRecordAttendance = async (
  records: Array<{
    childId: string;
    userId: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
  }>
): Promise<Attendance[]> => {
  const attendanceRecords = records.map(r => ({
    child_id: r.childId,
    user_id: r.userId,
    date: r.date,
    status: r.status,
    notes: r.notes,
    checked_in_at: r.status === 'present' || r.status === 'late' ? new Date().toISOString() : undefined,
  }));
  
  const { data, error } = await supabase
    .from('attendance')
    .upsert(attendanceRecords, {
      onConflict: 'child_id,date'
    })
    .select();
  
  if (error) throw error;
  return (data || []) as Attendance[];
};

export const updateAttendance = async (
  attendanceId: string,
  status: AttendanceStatus,
  notes?: string
): Promise<Attendance> => {
  const checked_in_at = status === 'present' || status === 'late' ? new Date().toISOString() : undefined;
  
  const { data, error } = await supabase
    .from('attendance')
    .update({
      status,
      notes,
      checked_in_at,
    })
    .eq('id', attendanceId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Attendance;
};

export const deleteAttendance = async (attendanceId: string): Promise<void> => {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId);
  
  if (error) throw error;
};

export const getAttendanceStats = async (userId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId);
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  const records = (data || []) as Attendance[];
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  
  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate,
  };
};

export const getChildAttendanceStats = async (childId: string, startDate?: string, endDate?: string) => {
  const records = await getAttendanceByChild(childId, startDate, endDate);
  
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  
  // Calculate consecutive absences
  let consecutiveAbsences = 0;
  let maxConsecutiveAbsences = 0;
  let currentStreak = 0;
  
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  for (const record of records) {
    if (record.status === 'absent') {
      currentStreak++;
      maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  consecutiveAbsences = records[0]?.status === 'absent' ? currentStreak : 0;
  
  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate,
    consecutiveAbsences,
    maxConsecutiveAbsences,
  };
};

