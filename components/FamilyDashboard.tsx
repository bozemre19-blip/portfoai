/**
 * FamilyDashboard Component
 * Main dashboard for family users - shows linked children and announcements
 * MODERN UI - Lukid AI Brand Colors (Orange/Coral + Navy)
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { getLanguage, setLanguage, t } from '../constants.clean';
import {
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
    ChatBubbleLeftEllipsisIcon,
    ChevronRightIcon,
    BellAlertIcon,
    SparklesIcon,
    PhotoIcon,
    XMarkIcon,
    PencilSquareIcon,
    CameraIcon
} from '@heroicons/react/24/outline';
import { getLinkedChildren, getFamilySharedMedia, getSignedUrlForMedia } from '../services/api';
import FamilyLinkCode from './FamilyLinkCode';
import FamilyChildDetail from './FamilyChildDetail';
import FamilyChat from './FamilyChat';
import FamilyObservationForm from './FamilyObservationForm';
import FamilyMediaUpload from './FamilyMediaUpload';
import FamilyMyContent from './FamilyMyContent';
import { FolderOpenIcon } from '@heroicons/react/24/outline';

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    classroom?: string;
    dob: string;
    user_id: string;
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
    child_id?: string;
}

const FamilyDashboard: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [currentLang, setCurrentLang] = useState(getLanguage());
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [chatChild, setChatChild] = useState<Child | null>(null);
    const [sharedMedia, setSharedMedia] = useState<Array<{ id: string; child_id: string; child_name: string; name: string; description: string; domain: string; storage_path: string; created_at: string; url?: string }>>([]);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; name: string } | null>(null);
    const [observationChild, setObservationChild] = useState<Child | null>(null);
    const [mediaUploadChild, setMediaUploadChild] = useState<Child | null>(null);
    const [myContentChild, setMyContentChild] = useState<Child | null>(null);

    const loadData = async () => {
        setLoading(true);
        const { data: childrenData, error } = await supabase.rpc('get_family_linked_children');
        if (error) {
            console.error('Error loading children:', error);
            setChildren([]);
        } else {
            setChildren(childrenData || []);
            const { data: announcementsData, error: annError } = await supabase.rpc('get_family_announcements');
            if (annError) {
                console.error('Error loading announcements:', annError);
                setAnnouncements([]);
            } else {
                setAnnouncements(announcementsData || []);
            }
        }
        // Load shared media
        try {
            const mediaData = await getFamilySharedMedia();
            const mediaWithUrls = await Promise.all(
                (mediaData || []).map(async (m) => {
                    try {
                        const url = await getSignedUrlForMedia(m.storage_path, 3600);
                        return { ...m, url };
                    } catch {
                        return m;
                    }
                })
            );
            setSharedMedia(mediaWithUrls);
        } catch (e) {
            console.error('Error loading shared media:', e);
            setSharedMedia([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSignOut = async () => {
        try { await supabase.auth.signOut(); } catch (e) { console.error('SignOut error:', e); }
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

    const calculateAge = (dob: string) => {
        const birth = new Date(dob);
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        if (months < 0) { years--; months += 12; }
        return `${years} yıl, ${months} ay`;
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return t('today') || 'Bugün';
        if (diffDays === 1) return t('yesterday') || 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1E2A4A] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-[#F97B5C]/30"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F97B5C] animate-spin"></div>
                        <SparklesIcon className="absolute inset-4 w-12 h-12 text-[#F97B5C]" />
                    </div>
                    <p className="text-white/70 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1E2A4A] via-[#243352] to-[#1E2A4A]">
            {/* Header */}
            <header className="relative z-10 pt-safe">
                <div className="h-14 md:hidden"></div>
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-[#F97B5C] rounded-2xl blur opacity-40"></div>
                                <img
                                    src="/lukid-logo.png"
                                    alt="Lukid AI"
                                    className="relative w-12 h-12 object-contain bg-white/10 backdrop-blur-sm rounded-2xl p-1"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{t('familyPortal')}</h1>
                                <p className="text-xs text-white/50">Çocuğunuzun gelişimini takip edin</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const newLang = currentLang === 'tr' ? 'en' : 'tr';
                                setLanguage(newLang);
                                setCurrentLang(newLang);
                            }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all text-white/80 text-sm font-medium"
                        >
                            {currentLang === 'tr' ? '🇺🇸 EN' : '🇹🇷 TR'}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all text-red-400 text-sm font-medium border border-red-500/30"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 pb-32">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-[#F97B5C] to-[#FF9472] rounded-3xl p-6 mb-8 shadow-xl shadow-[#F97B5C]/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="text-2xl">👋</span> Hoş Geldiniz
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {children.length === 0
                                    ? 'Henüz bir çocuk bağlamadınız'
                                    : `${announcements.length} yeni duyuru bekliyor`
                                }
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <span className="text-white font-bold">{children.length}</span>
                            <span className="text-white/80 text-sm ml-1">Çocuk</span>
                        </div>
                    </div>
                </div>

                {/* Children Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#2D3B5E] flex items-center justify-center border border-white/10">
                                <span className="text-lg">👶</span>
                            </div>
                            {t('myChildren')}
                        </h2>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#F97B5C] text-white rounded-xl hover:bg-[#FF9472] transition-all text-sm font-medium shadow-lg shadow-[#F97B5C]/25"
                        >
                            <UserPlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('addChildLink')}</span>
                            <span className="sm:hidden">Ekle</span>
                        </button>
                    </div>

                    {children.length === 0 ? (
                        <div className="bg-[#2D3B5E] rounded-3xl p-8 text-center border border-white/10 border-dashed">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F97B5C]/20 flex items-center justify-center">
                                <span className="text-4xl">📝</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {t('noChildrenLinked')}
                            </h3>
                            <p className="text-white/50 mb-6 text-sm max-w-xs mx-auto">
                                {t('linkChildInstruction')}
                            </p>
                            <button
                                onClick={() => setShowLinkModal(true)}
                                className="px-6 py-3 bg-[#F97B5C] text-white rounded-xl hover:bg-[#FF9472] transition-all font-medium shadow-lg shadow-[#F97B5C]/25"
                            >
                                {t('enterInviteCode')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {children.map((child, index) => (
                                <div
                                    key={child.id}
                                    className="group bg-[#2D3B5E] rounded-2xl p-5 border border-white/10 hover:border-[#F97B5C]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#F97B5C]/10"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Avatar & Info Wrapper */}
                                        <div className="flex items-center gap-4 w-full sm:w-auto flex-grow">
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-[#F97B5C] to-[#FF9472] rounded-full opacity-50 group-hover:opacity-100 transition-opacity blur-sm"></div>
                                                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#F97B5C] to-[#FF9472] p-0.5">
                                                    <div className="w-full h-full rounded-full bg-[#1E2A4A] flex items-center justify-center overflow-hidden">
                                                        {child.photo_url ? (
                                                            <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-bold text-white">
                                                                {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {child.first_name} {child.last_name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-sm text-white/50 flex items-center gap-1">
                                                        <span className="text-[#F97B5C]">📅</span> {calculateAge(child.dob)}
                                                    </span>
                                                    {child.classroom && (
                                                        <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                                                            {child.classroom}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto pt-3 border-t border-white/10 sm:pt-0 sm:border-t-0">
                                            <button
                                                onClick={() => setObservationChild(child)}
                                                className="flex-1 sm:flex-none h-10 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center"
                                                title="Gözlem Ekle"
                                            >
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setMediaUploadChild(child)}
                                                className="flex-1 sm:flex-none h-10 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center justify-center"
                                                title="Fotoğraf/Video Ekle"
                                            >
                                                <CameraIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setMyContentChild(child)}
                                                className="flex-1 sm:flex-none h-10 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors flex items-center justify-center"
                                                title="Eklediklerim"
                                            >
                                                <FolderOpenIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setChatChild(child)}
                                                className="flex-1 sm:flex-none h-10 rounded-xl bg-[#F97B5C]/20 text-[#F97B5C] hover:bg-[#F97B5C]/30 transition-colors flex items-center justify-center"
                                                title={t('sendMessageToTeacher')}
                                            >
                                                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedChild(child)}
                                                className="flex-1 sm:flex-none h-10 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors flex items-center justify-center"
                                            >
                                                <ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#F97B5C] flex items-center justify-center">
                                <BellAlertIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">{t('announcements')}</h2>
                            <span className="ml-auto text-xs bg-[#F97B5C]/20 text-[#F97B5C] px-3 py-1 rounded-full">
                                {announcements.length} yeni
                            </span>
                        </div>

                        <div className="space-y-4">
                            {announcements.map((ann, index) => {
                                const priorityConfig = {
                                    urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚨', accent: 'text-red-400' },
                                    high: { bg: 'bg-[#F97B5C]/10', border: 'border-[#F97B5C]/30', icon: '⚠️', accent: 'text-[#F97B5C]' },
                                    normal: { bg: 'bg-[#2D3B5E]', border: 'border-white/10', icon: '📢', accent: 'text-white/60' }
                                };
                                const config = priorityConfig[ann.priority as keyof typeof priorityConfig] || priorityConfig.normal;

                                return (
                                    <div
                                        key={ann.id}
                                        className={`${config.bg} rounded-2xl p-5 border ${config.border} transition-all duration-300 hover:scale-[1.01]`}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                                                {config.icon}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <h3 className="font-bold text-white">{ann.title}</h3>
                                                    {ann.pinned && (
                                                        <span className="text-xs bg-[#F97B5C]/30 text-[#F97B5C] px-2 py-0.5 rounded-full">
                                                            📌 {t('pinned')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white/60 text-sm line-clamp-2 mb-3">{ann.content}</p>
                                                <div className="flex items-center gap-3 text-xs text-white/40">
                                                    <span>{getTimeAgo(ann.created_at)}</span>
                                                    <span>•</span>
                                                    {ann.child_id ? (
                                                        <span className="text-[#F97B5C]">🎯 {t('childSpecificAnnouncement')}</span>
                                                    ) : (
                                                        <span>🏫 {ann.classroom}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Shared Media Section */}
                {sharedMedia.length > 0 && (
                    <section className="mt-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <PhotoIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">{t('sharedMedia')}</h2>
                            <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                                {sharedMedia.length} görsel
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {sharedMedia.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => m.url && setSelectedMedia({ url: m.url, name: m.name })}
                                    className="group relative aspect-square rounded-2xl overflow-hidden bg-[#2D3B5E] border border-white/10 hover:border-[#F97B5C]/50 transition-all"
                                >
                                    {m.url ? (
                                        <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                            <PhotoIcon className="w-8 h-8 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-white text-xs font-medium truncate">{m.name}</p>
                                        <p className="text-white/50 text-[10px] truncate">{m.child_name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Link Code Modal */}
            {showLinkModal && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowLinkModal(false)}
                >
                    <div onClick={e => e.stopPropagation()} className="animate-fade-in">
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
            {/* Observation Form Modal */}
            {observationChild && (
                <FamilyObservationForm
                    childId={observationChild.id}
                    childName={`${observationChild.first_name} ${observationChild.last_name}`}
                    onClose={() => setObservationChild(null)}
                    onSuccess={loadData}
                />
            )}

            {/* Media Upload Modal */}
            {mediaUploadChild && (
                <FamilyMediaUpload
                    childId={mediaUploadChild.id}
                    childName={`${mediaUploadChild.first_name} ${mediaUploadChild.last_name}`}
                    onClose={() => setMediaUploadChild(null)}
                    onSuccess={loadData}
                />
            )}

            {/* My Content Modal */}
            {myContentChild && (
                <FamilyMyContent
                    childId={myContentChild.id}
                    childName={`${myContentChild.first_name} ${myContentChild.last_name}`}
                    onClose={() => setMyContentChild(null)}
                    onRefresh={loadData}
                />
            )}

            {chatChild && (
                <FamilyChat
                    childId={chatChild.id}
                    teacherId={chatChild.user_id}
                    childName={`${chatChild.first_name} ${chatChild.last_name}`}
                    onClose={() => setChatChild(null)}
                />
            )}

            {/* Media Preview Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        onClick={() => setSelectedMedia(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                    <div className="max-w-4xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedMedia.url}
                            alt={selectedMedia.name}
                            className="w-full h-full object-contain rounded-2xl"
                        />
                        <p className="text-center text-white/70 mt-4 text-sm">{selectedMedia.name}</p>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-[#1E2A4A]/95 backdrop-blur-xl border-t border-white/10"></div>
                <div className="relative flex justify-around items-center h-[80px] pb-[env(safe-area-inset-bottom)] px-8">
                    <button
                        onClick={() => {
                            const newLang = currentLang === 'tr' ? 'en' : 'tr';
                            setLanguage(newLang);
                            setCurrentLang(newLang);
                        }}
                        className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-[#2D3B5E] flex items-center justify-center text-xl border border-white/10">
                            {currentLang === 'tr' ? '🇺🇸' : '🇹🇷'}
                        </div>
                        <span className="text-[10px] font-medium text-white/50">
                            {currentLang === 'tr' ? 'English' : 'Türkçe'}
                        </span>
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-[10px] font-medium text-red-400/70">
                            {t('logout')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FamilyDashboard;
