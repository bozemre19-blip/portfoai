/**
 * TeacherInbox Component
 * WhatsApp-style inbox showing all conversations from families
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { t } from '../constants.clean';

interface Conversation {
    other_user_id: string;
    other_user_name: string;
    child_id: string;
    child_name: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

interface TeacherInboxProps {
    navigate: (page: string, params?: any) => void;
}

const TeacherInbox: React.FC<TeacherInboxProps> = ({ navigate }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const loadConversations = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Get all messages for this user grouped by conversation
        const { data: messagesData, error } = await supabase
            .from('messages')
            .select(`
        *,
        children:child_id (first_name, last_name)
      `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading messages:', error);
            setLoading(false);
            return;
        }

        // Group by other user + child (conversation)
        const convMap = new Map<string, Conversation>();

        for (const msg of messagesData || []) {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const key = `${otherId}-${msg.child_id}`;

            if (!convMap.has(key)) {
                convMap.set(key, {
                    other_user_id: otherId,
                    other_user_name: '', // Will fetch later
                    child_id: msg.child_id,
                    child_name: msg.children ? `${msg.children.first_name} ${msg.children.last_name}` : 'Bilinmeyen',
                    last_message: msg.content,
                    last_message_at: msg.created_at,
                    unread_count: (msg.receiver_id === user.id && !msg.read) ? 1 : 0
                });
            } else {
                const conv = convMap.get(key)!;
                // Count unread messages
                if (msg.receiver_id === user.id && !msg.read) {
                    conv.unread_count++;
                }
                // last_message is already set to the most recent (due to order by created_at desc)
            }
        }

        // Fetch user names for all other_user_ids
        const otherIds = [...new Set([...convMap.values()].map(c => c.other_user_id))];
        if (otherIds.length > 0) {
            // Get from auth.users metadata via family_child_links or profiles if available
            // For now, use family_child_links to get names
            const { data: linksData } = await supabase
                .from('family_child_links')
                .select('family_user_id')
                .in('family_user_id', otherIds);

            // Since we can't directly query auth.users, we'll show "Veli" for family users
            for (const [key, conv] of convMap) {
                conv.other_user_name = 'Veli'; // Default name
            }
        }

        setConversations([...convMap.values()].sort((a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        ));
        setLoading(false);
    };

    const loadMessages = async (conv: Conversation) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('child_id', conv.child_id)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.other_user_id}),and(sender_id.eq.${conv.other_user_id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (!error) {
            setMessages(data || []);

            // Mark unread messages as read
            const unreadIds = (data || [])
                .filter(m => m.receiver_id === user.id && !m.read)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                console.log('Marking messages as read:', unreadIds);

                const { error: updateError } = await supabase
                    .from('messages')
                    .update({ read: true })
                    .in('id', unreadIds);

                console.log('Update result:', updateError ? 'ERROR: ' + updateError.message : 'SUCCESS');

                if (updateError) {
                    console.error('Failed to mark messages as read:', updateError);
                }

                // Update selectedConversation to show 0 unread regardless of update result
                setSelectedConversation(prev => prev ? { ...prev, unread_count: 0 } : null);

                // Silently reload conversations (without loading state)
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    const { data: messagesData } = await supabase
                        .from('messages')
                        .select(`*, children:child_id (first_name, last_name)`)
                        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                        .order('created_at', { ascending: false });

                    const convMap = new Map<string, Conversation>();
                    for (const msg of messagesData || []) {
                        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
                        const key = `${otherId}-${msg.child_id}`;
                        if (!convMap.has(key)) {
                            convMap.set(key, {
                                other_user_id: otherId,
                                other_user_name: 'Veli',
                                child_id: msg.child_id,
                                child_name: msg.children ? `${msg.children.first_name} ${msg.children.last_name}` : 'Bilinmeyen',
                                last_message: msg.content,
                                last_message_at: msg.created_at,
                                unread_count: (msg.receiver_id === currentUser.id && !msg.read) ? 1 : 0
                            });
                        } else {
                            const c = convMap.get(key)!;
                            if (msg.receiver_id === currentUser.id && !msg.read) c.unread_count++;
                        }
                    }
                    console.log('Reloaded conversations:', convMap.size);
                    setConversations([...convMap.values()].sort((a, b) =>
                        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                    ));
                }
            }
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        setSending(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: selectedConversation.other_user_id,
                child_id: selectedConversation.child_id,
                content: newMessage.trim(),
                conversation_id: null // Could use get_conversation_id function
            });

        if (!error) {
            setNewMessage('');
            await loadMessages(selectedConversation);
        }
        setSending(false);
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation);
        }
    }, [selectedConversation]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Dün';
        } else if (days < 7) {
            return date.toLocaleDateString('tr-TR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
    };

    // For chat messages - always show date + time
    const formatMessageTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return `Bugün ${time}`;
        } else if (isYesterday) {
            return `Dün ${time}`;
        } else {
            const dateFormat = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            return `${dateFormat} ${time}`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-500">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Chat View
    if (selectedConversation) {
        return (
            <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto">
                {/* Chat Header */}
                <div className="bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                    <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        ←
                    </button>
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                        <span className="text-teal-700 dark:text-teal-300 font-bold">V</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">
                            {selectedConversation.child_name}'in Velisi
                        </h3>
                        <p className="text-xs text-gray-500">Çocuk: {selectedConversation.child_name}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            Henüz mesaj yok
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === currentUserId
                                        ? 'bg-teal-600 text-white rounded-br-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-teal-100' : 'text-gray-400'}`}>
                                        {formatMessageTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Input */}
                <div className="bg-white dark:bg-gray-800 rounded-b-2xl border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Mesajınızı yazın..."
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !newMessage.trim()}
                            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                        >
                            {sending ? '...' : '📤'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Inbox View
    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('messages')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('messagesDesc')}</p>
                    </div>
                </div>
            </div>

            {conversations.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Henüz mesaj yok</h3>
                    <p className="text-gray-500">Velilerden gelen mesajlar burada görünecek</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    {conversations.map((conv, idx) => (
                        <button
                            key={`${conv.other_user_id}-${conv.child_id}`}
                            onClick={() => setSelectedConversation(conv)}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${idx !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                                }`}
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-teal-700 dark:text-teal-300 font-bold text-lg">V</span>
                                </div>
                                {conv.unread_count > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-semibold truncate ${conv.unread_count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {conv.child_name}'in Velisi
                                    </h3>
                                    <span className={`text-xs ${conv.unread_count > 0 ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
                                        {formatTime(conv.last_message_at)}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500'}`}>
                                    {conv.last_message}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherInbox;
