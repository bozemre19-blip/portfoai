/**
 * Family Links API Service
 * Handles family-child linking with invite code system
 */
import { supabase } from '../supabase';

export interface FamilyChildLink {
    id: string;
    family_user_id: string | null;
    child_id: string;
    relationship: string;
    status: 'pending' | 'approved' | 'rejected';
    invited_by: string;
    invite_code: string | null;
    created_at: string;
    approved_at: string | null;
}

/**
 * Generate a unique 6-character invite code
 */
const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (O, 0, I, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Create an invite for a family to link with a child
 * Called by teacher
 */
export const createFamilyInvite = async (
    childId: string,
    relationship: string = 'parent'
): Promise<{ invite_code: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Generate unique code
    let inviteCode = generateInviteCode();
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 5) {
        const { data: existing } = await supabase
            .from('family_child_links')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (!existing) break;
        inviteCode = generateInviteCode();
        attempts++;
    }

    const { data, error } = await supabase
        .from('family_child_links')
        .insert({
            child_id: childId,
            relationship,
            status: 'pending',
            invited_by: user.id,
            invite_code: inviteCode,
            family_user_id: null // Will be set when family claims
        })
        .select('invite_code')
        .single();

    if (error) {
        console.error('Error creating invite:', error);
        return null;
    }

    return data;
};

/**
 * Claim an invite code (family side)
 * Links the current user to the child
 */
export const claimInviteCode = async (
    inviteCode: string
): Promise<{ success: boolean; childId?: string; error?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Giriş yapmalısınız' };

    // Find the invite
    const { data: invite, error: findError } = await supabase
        .from('family_child_links')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .is('family_user_id', null)
        .single();

    if (findError || !invite) {
        return { success: false, error: 'Geçersiz veya kullanılmış davet kodu' };
    }

    // Check if already linked
    const { data: existing } = await supabase
        .from('family_child_links')
        .select('id')
        .eq('family_user_id', user.id)
        .eq('child_id', invite.child_id)
        .single();

    if (existing) {
        return { success: false, error: 'Bu çocuğa zaten bağlısınız' };
    }

    // Claim the invite
    const { error: updateError } = await supabase
        .from('family_child_links')
        .update({
            family_user_id: user.id,
            status: 'approved',
            approved_at: new Date().toISOString()
        })
        .eq('id', invite.id);

    if (updateError) {
        console.error('Error claiming invite:', updateError);
        return { success: false, error: 'Davet alınırken hata oluştu' };
    }

    return { success: true, childId: invite.child_id };
};

/**
 * Get all family links for a child (teacher view)
 */
export const getFamilyLinksForChild = async (
    childId: string
): Promise<FamilyChildLink[]> => {
    const { data, error } = await supabase
        .from('family_child_links')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching family links:', error);
        return [];
    }

    return data || [];
};

/**
 * Get all children linked to current family user
 */
export const getLinkedChildren = async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('family_child_links')
        .select('child_id')
        .eq('family_user_id', user.id)
        .eq('status', 'approved');

    if (error) {
        console.error('Error fetching linked children:', error);
        return [];
    }

    return data?.map(d => d.child_id) || [];
};

/**
 * Revoke a family link (teacher removes family access)
 */
export const revokeFamilyLink = async (linkId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('family_child_links')
        .delete()
        .eq('id', linkId);

    if (error) {
        console.error('Error revoking link:', error);
        return false;
    }

    return true;
};

/**
 * Get pending invites for a child
 */
export const getPendingInvites = async (childId: string): Promise<FamilyChildLink[]> => {
    const { data, error } = await supabase
        .from('family_child_links')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'pending')
        .is('family_user_id', null);

    if (error) {
        console.error('Error fetching pending invites:', error);
        return [];
    }

    return data || [];
};
