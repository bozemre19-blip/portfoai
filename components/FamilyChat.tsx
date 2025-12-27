/**
 * FamilyChat Component
 * Chat interface for family users to message teachers
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { t, getLanguage } from '../constants.clean';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

interface FamilyChatProps {
    childId: string;
    teacherId: string;
    childName: string;
    onClose: () => void;
}

const FamilyChat: React.FC<FamilyChatProps> = ({ childId, teacherId, childName, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const loadMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('child_id', childId)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${teacherId}),and(sender_id.eq.${teacherId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (!error) {
            setMessages(data || []);

            // Mark unread messages as read
            const unreadIds = (data || [])
                .filter(m => m.receiver_id === user.id && !m.read)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .in('id', unreadIds);
            }
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        setSending(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: teacherId,
                child_id: childId,
                content: newMessage.trim()
            });

        if (!error) {
            setNewMessage('');
            await loadMessages();
        }
        setSending(false);
    };

    useEffect(() => {
        loadMessages();

        // Poll for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [childId, teacherId]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return `${t('today')} ${time}`;
        } else if (isYesterday) {
            return `${t('yesterday')} ${time}`;
        } else {
            const lang = getLanguage() === 'tr' ? 'tr-TR' : 'en-US';
            const dateFormat = date.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
            return `${dateFormat} ${time}`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        ✕
                    </button>
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 dark:text-emerald-300 text-lg">👩‍🏫</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{t('teacherTitle')}</h3>
                        <p className="text-xs text-gray-500">
                            {getLanguage() === 'tr' ? `${childName} ${t('about')}` : `${t('about')} ${childName}`}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin text-2xl">⏳</div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-4xl mb-2">💬</p>
                            <p>Öğretmenle sohbet başlatın</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === currentUserId
                                        ? 'bg-orange-500 text-white rounded-br-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-orange-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Mesajınızı yazın..."
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !newMessage.trim()}
                            className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50"
                        >
                            {sending ? '...' : '📤'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyChat;
