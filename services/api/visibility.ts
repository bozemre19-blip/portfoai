/**
 * Visibility API Service
 * Handles visibility settings for observations, media, goals, etc.
 */
import { supabase } from '../supabase';

export type VisibilityContentType = 'observation' | 'media' | 'goal' | 'assessment';

export interface VisibilitySetting {
    id: string;
    content_type: VisibilityContentType;
    content_id: string;
    visible_to_family: boolean;
    updated_by: string;
    updated_at: string;
}

/**
 * Get visibility setting for a specific content item
 */
export const getVisibility = async (
    contentType: VisibilityContentType,
    contentId: string
): Promise<boolean> => {
    const { data } = await supabase
        .from('visibility_settings')
        .select('visible_to_family')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .single();

    return data?.visible_to_family ?? false;
};

/**
 * Set visibility for a specific content item
 */
export const setVisibility = async (
    contentType: VisibilityContentType,
    contentId: string,
    visible: boolean
): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('visibility_settings')
        .upsert({
            content_type: contentType,
            content_id: contentId,
            visible_to_family: visible,
            updated_by: user.id,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'content_type,content_id'
        });

    if (error) {
        console.error('Error setting visibility:', error);
        return false;
    }

    return true;
};

/**
 * Toggle visibility for a content item
 */
export const toggleVisibility = async (
    contentType: VisibilityContentType,
    contentId: string
): Promise<boolean | null> => {
    const current = await getVisibility(contentType, contentId);
    const newValue = !current;
    const success = await setVisibility(contentType, contentId, newValue);
    return success ? newValue : null;
};

/**
 * Get all visible content IDs of a specific type for a child
 */
export const getVisibleContentIds = async (
    contentType: VisibilityContentType,
    childId?: string
): Promise<string[]> => {
    let query = supabase
        .from('visibility_settings')
        .select('content_id')
        .eq('content_type', contentType)
        .eq('visible_to_family', true);

    // For future filtering by child, if needed
    // This would require joining with the content table

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching visible content:', error);
        return [];
    }

    return data?.map(d => d.content_id) || [];
};

/**
 * Batch get visibility for multiple content items
 */
export const getBatchVisibility = async (
    contentType: VisibilityContentType,
    contentIds: string[]
): Promise<Record<string, boolean>> => {
    if (contentIds.length === 0) return {};

    const { data, error } = await supabase
        .from('visibility_settings')
        .select('content_id, visible_to_family')
        .eq('content_type', contentType)
        .in('content_id', contentIds);

    if (error) {
        console.error('Error fetching batch visibility:', error);
        return {};
    }

    const result: Record<string, boolean> = {};

    // Initialize all to false
    for (const id of contentIds) {
        result[id] = false;
    }

    // Set true for visible ones
    for (const item of data || []) {
        result[item.content_id] = item.visible_to_family;
    }

    return result;
};
