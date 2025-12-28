/**
 * FamilyMyContent Component
 * Modal for families to view, edit, and delete their own observations and media
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getSignedUrlForMedia } from '../services/api';
import { getDomains, t } from '../constants.clean';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface FamilyMyContentProps {
    childId: string;
    childName: string;
    onClose: () => void;
    onRefresh: () => void;
}

interface FamilyObservation {
    id: string;
    note: string;
    context: string;
    domains: string[];
    created_at: string;
}

interface FamilyMedia {
    id: string;
    name: string;
    description: string;
    type: string;
    storage_path: string;
    created_at: string;
}

type Tab = 'observations' | 'media';

const FamilyMyContent: React.FC<FamilyMyContentProps> = ({ childId, childName, onClose, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<Tab>('observations');
    const [observations, setObservations] = useState<FamilyObservation[]>([]);
    const [media, setMedia] = useState<FamilyMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
    const [editingObs, setEditingObs] = useState<FamilyObservation | null>(null);
    const [editNote, setEditNote] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [childId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: obsData } = await supabase
                .from('observations')
                .select('id, note, context, domains, created_at')
                .eq('child_id', childId)
                .eq('user_id', user.id)
                .eq('added_by', 'family')
                .order('created_at', { ascending: false });

            setObservations(obsData || []);

            const { data: mediaData } = await supabase
                .from('media')
                .select('id, name, description, type, storage_path, created_at')
                .eq('child_id', childId)
                .eq('user_id', user.id)
                .eq('added_by', 'family')
                .order('created_at', { ascending: false });

            setMedia(mediaData || []);

            const urls: Record<string, string> = {};
            for (const m of (mediaData || [])) {
                try {
                    urls[m.id] = await getSignedUrlForMedia(m.storage_path);
                } catch (e) {
                    console.error('Error loading media URL:', e);
                }
            }
            setMediaUrls(urls);
        } catch (error) {
            console.error('Error loading family content:', error);
        }
        setLoading(false);
    };

    const handleDeleteObservation = async (id: string) => {
        if (!confirm(t('confirmDeleteObservation'))) return;
        setDeleting(id);
        try {
            await supabase.from('observations').delete().eq('id', id);
            setObservations(prev => prev.filter(o => o.id !== id));
            onRefresh();
        } catch (error) {
            console.error('Error deleting observation:', error);
            alert(t('deleteError'));
        }
        setDeleting(null);
    };

    const handleDeleteMedia = async (id: string, storagePath: string) => {
        if (!confirm(t('confirmDeleteMedia'))) return;
        setDeleting(id);
        try {
            await supabase.storage.from('child-media').remove([storagePath]);
            await supabase.from('media').delete().eq('id', id);
            setMedia(prev => prev.filter(m => m.id !== id));
            onRefresh();
        } catch (error) {
            console.error('Error deleting media:', error);
            alert(t('deleteError'));
        }
        setDeleting(null);
    };

    const handleEditObservation = async () => {
        if (!editingObs || !editNote.trim()) return;
        try {
            await supabase
                .from('observations')
                .update({ note: editNote.trim() })
                .eq('id', editingObs.id);

            setObservations(prev => prev.map(o =>
                o.id === editingObs.id ? { ...o, note: editNote.trim() } : o
            ));
            setEditingObs(null);
            setEditNote('');
            onRefresh();
        } catch (error) {
            console.error('Error updating observation:', error);
            alert(t('updateError'));
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDomainLabel = (key: string) => getDomains()[key] || key;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-xl">📁</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{t('myContent')}</h2>
                                <p className="text-teal-100 text-sm">{childName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('observations')}
                        className={`flex-1 py-3 px-4 font-medium transition-colors ${activeTab === 'observations'
                                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        📝 {t('myObservations')} ({observations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-3 px-4 font-medium transition-colors ${activeTab === 'media'
                                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        📷 {t('myPhotos')} ({media.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : activeTab === 'observations' ? (
                        observations.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">📝</div>
                                <p className="text-gray-500 dark:text-gray-400">{t('noObservationsYet')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {observations.map(obs => (
                                    <div
                                        key={obs.id}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                                    >
                                        {editingObs?.id === obs.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editNote}
                                                    onChange={(e) => setEditNote(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleEditObservation}
                                                        className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm"
                                                    >
                                                        {t('save')}
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingObs(null); setEditNote(''); }}
                                                        className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                                                    >
                                                        {t('cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(obs.created_at)}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => { setEditingObs(obs); setEditNote(obs.note); }}
                                                            className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteObservation(obs.id)}
                                                            disabled={deleting === obs.id}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">{obs.note}</p>
                                                {obs.domains && obs.domains.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {obs.domains.map(d => (
                                                            <span key={d} className="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full">
                                                                {getDomainLabel(d)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        media.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">📷</div>
                                <p className="text-gray-500 dark:text-gray-400">{t('noPhotosYet')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {media.map(m => (
                                    <div
                                        key={m.id}
                                        className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm"
                                    >
                                        {m.type === 'video' ? (
                                            <video src={mediaUrls[m.id]} className="w-full h-32 object-cover" controls />
                                        ) : (
                                            <img src={mediaUrls[m.id]} alt={m.name} className="w-full h-32 object-cover" />
                                        )}
                                        <div className="p-2">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-gray-800 dark:text-white text-xs truncate flex-1">{m.name}</p>
                                                <button
                                                    onClick={() => handleDeleteMedia(m.id, m.storage_path)}
                                                    disabled={deleting === m.id}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(m.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyMyContent;
