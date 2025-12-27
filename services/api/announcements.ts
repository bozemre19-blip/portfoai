/**
 * Announcements API Service
 * Handles class announcements for teacher-family communication
 */
import { supabase } from '../supabase';

export interface Announcement {
    id: string;
    user_id: string;
    classroom: string;
    child_id: string | null;  // null = class-wide, set = child-specific
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    pinned: boolean;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateAnnouncementInput {
    classroom: string;
    child_id?: string | null;  // null = class-wide, set = child-specific
    title: string;
    content: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    pinned?: boolean;
    expires_at?: string | null;
}

/**
 * Get announcements for a classroom (teacher view)
 */
export const getAnnouncementsForClassroom = async (
    classroom: string
): Promise<Announcement[]> => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('classroom', classroom)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }

    return data || [];
};

/**
 * Get all announcements by current teacher
 */
export const getMyAnnouncements = async (): Promise<Announcement[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my announcements:', error);
        return [];
    }

    return data || [];
};

/**
 * Create a new announcement
 */
export const createAnnouncement = async (
    input: CreateAnnouncementInput
): Promise<Announcement | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('announcements')
        .insert({
            user_id: user.id,
            classroom: input.classroom,
            child_id: input.child_id || null,
            title: input.title,
            content: input.content,
            priority: input.priority || 'normal',
            pinned: input.pinned || false,
            expires_at: input.expires_at || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating announcement:', error);
        return null;
    }

    return data;
};

/**
 * Update an announcement
 */
export const updateAnnouncement = async (
    id: string,
    updates: Partial<CreateAnnouncementInput>
): Promise<boolean> => {
    const { error } = await supabase
        .from('announcements')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating announcement:', error);
        return false;
    }

    return true;
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting announcement:', error);
        return false;
    }

    return true;
};

/**
 * Toggle pin status of an announcement
 */
export const toggleAnnouncementPin = async (
    id: string,
    pinned: boolean
): Promise<boolean> => {
    return await updateAnnouncement(id, { pinned });
};
