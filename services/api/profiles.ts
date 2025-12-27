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
