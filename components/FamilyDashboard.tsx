/**
 * FamilyDashboard Component
 * Main dashboard for family users - shows linked children and announcements
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { getLanguage, setLanguage, t } from '../constants.clean';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { getLinkedChildren } from '../services/api';
import FamilyLinkCode from './FamilyLinkCode';
import FamilyChildDetail from './FamilyChildDetail';
import FamilyChat from './FamilyChat';

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    classroom?: string;
    dob: string;
    user_id: string; // Teacher's ID
    guardians?: any[];
    health?: { allergies?: string[]; notes?: string };
    interests?: string[];
    strengths?: string[];
    created_at?: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    pinned: boolean;
    created_at: string;
    classroom: string;
}

const FamilyDashboard: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [currentLang, setCurrentLang] = useState(getLanguage());
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [chatChild, setChatChild] = useState<Child | null>(null);

    const loadData = async () => {
        setLoading(true);

        // Use RPC function to get linked children (bypasses RLS safely)
        const { data: childrenData, error } = await supabase.rpc('get_family_linked_children');

        if (error) {
            console.error('Error loading children:', error);
            setChildren([]);
        } else {
            setChildren(childrenData || []);

            // Use RPC function to get all announcements (bypasses RLS safely)
            const { data: announcementsData, error: annError } = await supabase.rpc('get_family_announcements');

            if (annError) {
                console.error('Error loading announcements:', annError);
                setAnnouncements([]);
            } else {
                setAnnouncements(announcementsData || []);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('SignOut error:', e);
        }
        // Clear storage and reload
        try {
            sessionStorage.clear();
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('sb-') || k.includes('supabase'))) keys.push(k);
            }
            keys.forEach(k => localStorage.removeItem(k));
        } catch { }
        window.location.reload();
    };

    const handleLinkSuccess = () => {
        setShowLinkModal(false);
        loadData();
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
            case 'high':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
            default:
                return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return '🚨';
            case 'high': return '⚠️';
            default: return '📢';
        }
    };

    const calculateAge = (dob: string) => {
        const birth = new Date(dob);
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        if (months < 0) { years--; months += 12; }
        return `${years} yaş ${months} ay`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-orange-600 dark:text-orange-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-orange-200 dark:border-gray-700 sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
                <div className="max-w-4xl mx-auto px-3 py-3 md:px-4 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img src="/lukid-logo.png" alt="Lukid AI" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                        <h1 className="text-base md:text-xl font-bold text-slate-800 dark:text-orange-200 leading-tight">{t('familyPortal')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const newLang = currentLang === 'tr' ? 'en' : 'tr';
                                setLanguage(newLang);
                                setCurrentLang(newLang);
                            }}
                            className="px-2 py-1 md:px-3 md:py-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border border-orange-100 dark:border-gray-600 font-medium text-xs md:text-sm whitespace-nowrap"
                        >
                            {currentLang === 'tr' ? '🇺🇸 EN' : '🇹🇷 TR'}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-2 md:px-4 md:py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={t('logout') || 'Çıkış Yap'}
                        >
                            <span className="hidden md:inline">{t('logout') || 'Çıkış Yap'}</span>
                            <ArrowRightOnRectangleIcon className="w-5 h-5 md:hidden" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Children Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span>👶</span> {t('myChildren')}
                        </h2>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm flex items-center gap-2"
                        >
                            <span>➕</span> {t('addChildLink')}
                        </button>
                    </div>

                    {children.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
                            <div className="text-5xl mb-4">📝</div>
                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                                {t('noChildrenLinked')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {t('linkChildInstruction')}
                            </p>
                            <button
                                onClick={() => setShowLinkModal(true)}
                                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                {t('enterInviteCode')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {children.map(child => (
                                <div
                                    key={child.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg flex items-center gap-4"
                                >
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {child.photo_url ? (
                                            <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                            {child.first_name} {child.last_name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {calculateAge(child.dob)}
                                            </span>
                                            {child.classroom && (
                                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                                    • {child.classroom}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChatChild(child)}
                                            className="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-800/50 transition-colors"
                                            title={t('sendMessageToTeacher')}
                                        >
                                            💬
                                        </button>
                                        <button
                                            onClick={() => setSelectedChild(child)}
                                            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                                        >
                                            {t('details')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                            <span>📢</span> {t('announcements')}
                        </h2>
                        <div className="space-y-4">
                            {announcements.map(ann => (
                                <div
                                    key={ann.id}
                                    className={`rounded-2xl p-5 border-2 shadow-sm ${getPriorityStyles(ann.priority)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getPriorityIcon(ann.priority)}</span>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800 dark:text-white">{ann.title}</h3>
                                                {ann.pinned && (
                                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                                                        📌 {t('pinned')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{ann.content}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                {new Date(ann.created_at).toLocaleDateString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })} • {ann.child_id ? (
                                                    <span className="text-purple-500 dark:text-purple-400">🎯 {t('childSpecificAnnouncement')}</span>
                                                ) : (
                                                    <span>🏫 {ann.classroom}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Link Code Modal */}
            {showLinkModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowLinkModal(false)}
                >
                    <div onClick={e => e.stopPropagation()}>
                        <FamilyLinkCode onSuccess={handleLinkSuccess} />
                    </div>
                </div>
            )}

            {/* Child Detail Modal */}
            {selectedChild && (
                <FamilyChildDetail
                    child={selectedChild}
                    onClose={() => setSelectedChild(null)}
                />
            )}

            {/* Chat Modal */}
            {chatChild && (
                <FamilyChat
                    childId={chatChild.id}
                    teacherId={chatChild.user_id}
                    childName={`${chatChild.first_name} ${chatChild.last_name}`}
                    onClose={() => setChatChild(null)}
                />
            )}
        </div>
    );
};

export default FamilyDashboard;
