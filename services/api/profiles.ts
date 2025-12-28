/**
 * Profiles API Service
 * Handles user profile operations and role management
 */
import { supabase } from '../supabase';

export interface Profile {
    id: string;
    role: 'teacher' | 'family';
    first_name: string | null;
    last_name: string | null;
    school_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get current user's profile
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
};

/**
 * Get user role from profile or metadata
 */
export const getUserRole = async (): Promise<'teacher' | 'family' | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // First try to get from profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role) {
        return profile.role;
    }

    // Fallback to user metadata (for users before profiles table existed)
    const metaRole = user.user_metadata?.role;
    if (metaRole === 'teacher' || metaRole === 'family') {
        return metaRole;
    }

    // Default to teacher for legacy users
    return 'teacher';
};

/**
 * Update current user's profile
 */
export const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }

    return data;
};

/**
 * Create profile if it doesn't exist (for legacy users)
 */
export const ensureProfileExists = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if profile exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (existing) return existing;

    // Create profile from user metadata
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            role: user.user_metadata?.role || 'teacher',
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            school_name: user.user_metadata?.school_name || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        return null;
    }

    return data;
};

// Messaging Hours Types & Functions
export interface MessagingHours {
    enabled: boolean;
    manual_override: boolean | null; // null = use schedule, true = force on, false = force off
    days: number[]; // 0=Sunday, 1=Monday, etc.
    start_time: string; // "HH:MM"
    end_time: string; // "HH:MM"
}

const DEFAULT_MESSAGING_HOURS: MessagingHours = {
    enabled: false,
    manual_override: null,
    days: [1, 2, 3, 4, 5], // Monday-Friday
    start_time: '09:00',
    end_time: '17:00'
};

/**
 * Get teacher's messaging hours settings
 */
export const getMessagingHours = async (teacherId: string): Promise<MessagingHours> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('messaging_hours')
        .eq('id', teacherId)
        .single();

    if (error || !data?.messaging_hours) {
        return DEFAULT_MESSAGING_HOURS;
    }

    return data.messaging_hours as MessagingHours;
};

/**
 * Update teacher's messaging hours settings
 * Uses upsert to create profile if it doesn't exist
 */
export const updateMessagingHours = async (hours: MessagingHours): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('updateMessagingHours: No user logged in');
        return false;
    }

    console.log('updateMessagingHours: Saving for user', user.id, hours);

    // First check if profile exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!existingProfile) {
        // Create profile if it doesn't exist
        console.log('updateMessagingHours: Profile not found, creating new profile');
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                role: user.user_metadata?.role || 'teacher',
                first_name: user.user_metadata?.first_name || null,
                last_name: user.user_metadata?.last_name || null,
                school_name: user.user_metadata?.school_name || null,
                messaging_hours: hours
            });

        if (insertError) {
            console.error('updateMessagingHours: Error creating profile:', insertError);
            return false;
        }
        console.log('updateMessagingHours: Profile created successfully');
        return true;
    }

    // Update existing profile
    const { data, error } = await supabase
        .from('profiles')
        .update({ messaging_hours: hours })
        .eq('id', user.id)
        .select();

    if (error) {
        console.error('updateMessagingHours: Error saving:', error);
        return false;
    }

    console.log('updateMessagingHours: Saved successfully:', data);
    return true;
};

/**
 * Set manual override for teacher availability
 * @param override - true = accepting messages, false = not accepting, null = use schedule
 */
export const setManualOverride = async (override: boolean | null): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get current settings
    const current = await getMessagingHours(user.id);

    const { error } = await supabase
        .from('profiles')
        .update({
            messaging_hours: { ...current, manual_override: override }
        })
        .eq('id', user.id);

    return !error;
};

/**
 * Check if teacher is currently available (client-side check)
 */
export const isTeacherAvailable = (hours: MessagingHours): boolean => {
    // If not enabled, always available
    if (!hours.enabled) return true;

    // Check manual override
    if (hours.manual_override === true) return true;
    if (hours.manual_override === false) return false;

    // Check schedule
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday

    // Check if today is an allowed day
    if (!hours.days.includes(currentDay)) return false;

    // Check time
    const currentTime = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return currentTime >= hours.start_time && currentTime <= hours.end_time;
};

/**
 * Get next available time for messaging
 */
export const getNextAvailableTime = (hours: MessagingHours): Date | null => {
    if (!hours.enabled) return null;

    const now = new Date();
    const currentDay = now.getDay();

    // Find next available day
    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (hours.days.includes(checkDay)) {
            const result = new Date(now);
            result.setDate(now.getDate() + i);

            // Set to start time
            const [hours_str, minutes] = hours.start_time.split(':');
            result.setHours(parseInt(hours_str), parseInt(minutes), 0, 0);

            // If it's today and start time has passed but within hours, return now
            if (i === 0 && isTeacherAvailable(hours)) {
                return null; // Already available
            }

            // If it's today but past end time, check next day
            const currentTime = now.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            if (i === 0 && currentTime > hours.end_time) {
                continue;
            }

            return result;
        }
    }

    return null;
};
