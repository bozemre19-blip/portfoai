/**
 * FamilyAddedContent Component
 * Modal to display observations and media added by family members
 * Teacher can view content added by families for a specific child
 */
import React, { useState, useEffect } from 'react';
import { getFamilyAddedObservations, getFamilyAddedMedia, getSignedUrlForMedia } from '../services/api';
import { getDomains, t } from '../constants.clean';
import { useImageViewer } from './ImageViewerContext';

interface FamilyAddedContentProps {
    childId: string;
    childName: string;
    onClose: () => void;
}

type Tab = 'observations' | 'media';

interface FamilyObservation {
    id: string;
    child_id: string;
    user_id: string;
    note: string;
    context: string;
    domains: string[];
    tags: string[];
    created_at: string;
    added_by: string;
}

interface FamilyMedia {
    id: string;
    child_id: string;
    user_id: string;
    name: string;
    description: string;
    type: string;
    storage_path: string;
    domain: string;
    created_at: string;
    added_by: string;
}

const FamilyAddedContent: React.FC<FamilyAddedContentProps> = ({ childId, childName, onClose }) => {
    const { openImage } = useImageViewer();
    const [activeTab, setActiveTab] = useState<Tab>('observations');
    const [observations, setObservations] = useState<FamilyObservation[]>([]);
    const [media, setMedia] = useState<FamilyMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, [childId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [obsData, mediaData] = await Promise.all([
                getFamilyAddedObservations(childId),
                getFamilyAddedMedia(childId)
            ]);
            setObservations(obsData || []);
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDomainLabel = (domainKey: string) => {
        const domains = getDomains();
        return domains[domainKey] || domainKey;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">👨‍👩‍👧</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t('familyAddedContent')}</h2>
                                <p className="text-amber-100 text-sm">{childName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('observations')}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${activeTab === 'observations'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        📝 {t('observations')} ({observations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${activeTab === 'media'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        📷 {t('media')} ({media.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : activeTab === 'observations' ? (
                        observations.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📝</div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('noObservationsYet')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {observations.map(obs => (
                                    <div
                                        key={obs.id}
                                        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-600">👨‍👩‍👧</span>
                                                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">
                                                    Family
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(obs.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 mb-3">
                                            {obs.note}
                                        </p>
                                        {obs.domains && obs.domains.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {obs.domains.map(domain => (
                                                    <span
                                                        key={domain}
                                                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700"
                                                    >
                                                        {getDomainLabel(domain)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        media.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📷</div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('noPhotosYet')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {media.map(m => (
                                    <div
                                        key={m.id}
                                        className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm"
                                    >
                                        {m.type === 'video' ? (
                                            <video
                                                src={mediaUrls[m.id]}
                                                className="w-full h-40 object-cover"
                                                controls
                                            />
                                        ) : (
                                            <img
                                                src={mediaUrls[m.id]}
                                                alt={m.name}
                                                className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => openImage(mediaUrls[m.id], m.name)}
                                            />
                                        )}
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-amber-600">👨‍👩‍👧</span>
                                                <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                                                    {m.name}
                                                </p>
                                            </div>
                                            {m.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {m.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {formatDate(m.created_at)}
                                            </p>
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

export default FamilyAddedContent;
