
export type DevelopmentDomain = 'turkish' | 'math' | 'science' | 'social' | 'motor_health' | 'art' | 'music';
export type ObservationContext = 'classroom' | 'outdoor' | 'home' | 'other';
export type RiskLevel = 'low' | 'medium' | 'high';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone?: string;
  email?: string;
}

export interface HealthInfo {
  allergies?: string[];
  notes?: string;
}

export interface Child {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  photo_url?: string;
  classroom?: string;
  consent_obtained: boolean;
  created_at: string;
  guardians?: Guardian[];
  health?: HealthInfo;
  interests?: string[];
  strengths?: string[];
}

export interface Observation {
  id: string; // Can be a temporary UUID for offline items
  child_id: string;
  user_id: string;
  note: string;
  context?: ObservationContext;
  domains: DevelopmentDomain[];
  tags?: string[];
  media_ids?: string[];
  created_at: string;
  updated_at: string;
  assessment_id?: string;
  dirty?: boolean; // For offline sync
}

export interface Media {
  id: string;
  child_id: string;
  user_id: string;
  type: 'image' | 'video';
  storage_path: string;
  created_at: string;
  name: string;
  description?: string;
  domain?: DevelopmentDomain;
}

export interface Assessment {
  id: string;
  observation_id: string;
  user_id: string;
  domain_scores: Partial<Record<DevelopmentDomain, number>>;
  risk: RiskLevel;
  summary: string;
  suggestions: string[];
  created_at: string;
}



export interface Goal {
  id: string;
  child_id: string;
  user_id: string;
  title: string;
  description?: string;
  domain: DevelopmentDomain;
  status: GoalStatus;
  priority: GoalPriority;
  target_date?: string; // YYYY-MM-DD
  progress: number; // 0-100
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Attendance {
  id: string;
  child_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  checked_in_at?: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface OfflineObservation extends Omit<Observation, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  id: string; // Temp ID
  user_id?: string;
  created_at: string;
  updated_at?: string;
  dirty: true;
  media_files?: { file: File, name: string }[];
}