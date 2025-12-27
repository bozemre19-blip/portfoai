/**
 * Messages API Service
 * Handles teacher-family messaging with time-based restrictions
 */
import { supabase } from '../supabase';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    child_id: string | null;
    content: string;
    read_at: string | null;
    created_at: string;
}

export interface MessageSettings {
    id: string;
    user_id: string;
    messaging_enabled: boolean;
    available_start: string; // "08:00"
    available_end: string;   // "18:00"
    available_days: number[]; // [1,2,3,4,5] = Mon-Fri
    auto_reply_message: string | null;
    updated_at: string;
}

/**
 * Get or create message settings for current user
 */
export const getMessageSettings = async (): Promise<MessageSettings | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('message_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code === 'PGRST116') {
        // Not found - create default
        const { data: newSettings } = await supabase
            .from('message_settings')
            .insert({
                user_id: user.id,
                messaging_enabled: true,
                available_start: '08:00',
                available_end: '18:00',
                available_days: [1, 2, 3, 4, 5]
            })
            .select()
            .single();
        return newSettings;
    }

    return data;
};

/**
 * Update message settings
 */
export const updateMessageSettings = async (
    updates: Partial<Omit<MessageSettings, 'id' | 'user_id' | 'updated_at'>>
): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('message_settings')
        .upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    return !error;
};

/**
 * Check if messaging is currently available for a teacher
 */
export const isMessagingAvailable = async (teacherId: string): Promise<{
    available: boolean;
    autoReplyMessage?: string;
}> => {
    const { data: settings } = await supabase
        .from('message_settings')
        .select('*')
        .eq('user_id', teacherId)
        .single();

    if (!settings || !settings.messaging_enabled) {
        return {
            available: false,
            autoReplyMessage: settings?.auto_reply_message || 'Mesajlaşma şu an kapalı.'
        };
    }

    // Check day
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Convert 0 (Sunday) to 7

    if (!settings.available_days.includes(dayOfWeek)) {
        return {
            available: false,
            autoReplyMessage: settings.auto_reply_message || 'Mesajlaşma hafta içi saatlerinde açık.'
        };
    }

    // Check time
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const start = settings.available_start;
    const end = settings.available_end;

    if (currentTime < start || currentTime > end) {
        return {
            available: false,
            autoReplyMessage: settings.auto_reply_message || `Mesajlaşma ${start}-${end} saatleri arasında açık.`
        };
    }

    return { available: true };
};

/**
 * Get conversation between two users
 */
export const getConversation = async (
    otherUserId: string,
    childId?: string
): Promise<Message[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

    if (childId) {
        query = query.eq('child_id', childId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching conversation:', error);
        return [];
    }

    return data || [];
};

/**
 * Send a message
 */
export const sendMessage = async (
    receiverId: string,
    content: string,
    childId?: string
): Promise<Message | { error: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Giriş yapmalısınız' };

    // Check if receiver has messaging enabled (only for families messaging teachers)
    const availability = await isMessagingAvailable(receiverId);
    if (!availability.available) {
        return { error: availability.autoReplyMessage || 'Mesajlaşma şu an kapalı' };
    }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content,
            child_id: childId || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return { error: 'Mesaj gönderilemedi' };
    }

    return data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

    return !error;
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null);

    if (error) return 0;
    return count || 0;
};

/**
 * Get all conversations (grouped by user)
 */
export const getConversationList = async (): Promise<{
    userId: string;
    lastMessage: Message;
    unreadCount: number;
}[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get all messages involving current user
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (!messages) return [];

    // Group by other user
    const conversations: Record<string, { lastMessage: Message; unreadCount: number }> = {};

    for (const msg of messages) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        if (!conversations[otherUserId]) {
            conversations[otherUserId] = {
                lastMessage: msg,
                unreadCount: 0
            };
        }

        // Count unread from this user
        if (msg.receiver_id === user.id && !msg.read_at) {
            conversations[otherUserId].unreadCount++;
        }
    }

    return Object.entries(conversations).map(([userId, data]) => ({
        userId,
        ...data
    }));
};
