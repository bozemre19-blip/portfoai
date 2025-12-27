/**
 * FamilyChildDetail Component
 * Read-only view of child profile for family users
 * Shows: basic info, guardians, health, interests, strengths, shared observations
 * Does NOT show: AI insights, edit buttons
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { t, getDomains } from '../constants.clean';

interface Guardian {
    name: string;
    relation: string;
    phone?: string;
    email?: string;
}

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    dob: string;
    photo_url?: string;
    classroom?: string;
    guardians?: Guardian[];
    health?: { allergies?: string[]; notes?: string };
    interests?: string[];
    strengths?: string[];
    created_at?: string;
}

interface FamilyChildDetailProps {
    child: Child;
    onClose: () => void;
}

interface SharedObservation {
    id: string;
    note: string;
    domains: string[];
    context: string;
    created_at: string;
}

const FamilyChildDetail: React.FC<FamilyChildDetailProps> = ({ child, onClose }) => {
    const [observations, setObservations] = useState<SharedObservation[]>([]);
    const [loadingObs, setLoadingObs] = useState(true);

    useEffect(() => {
        const loadObservations = async () => {
            setLoadingObs(true);
            const { data, error } = await supabase
                .from('observations')
                .select('id, note, domains, context, created_at')
                .eq('child_id', child.id)
                .eq('shared_with_family', true)
                .order('created_at', { ascending: false });

            if (!error) {
                setObservations(data || []);
            }
            setLoadingObs(false);
        };
        loadObservations();
    }, [child.id]);

    const calculateAge = (dob: string) => {
        const birth = new Date(dob);
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        if (months < 0) { years--; months += 12; }
        return `${years} yaş ${months} ay`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getDomainLabel = (domain: string) => {
        return getDomains()[domain] || domain;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                                {child.photo_url ? (
                                    <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {child.first_name} {child.last_name}
                                </h2>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className="px-2 py-1 bg-white/20 rounded-full text-sm text-white">
                                        {calculateAge(child.dob)}
                                    </span>
                                    {child.classroom && (
                                        <span className="px-2 py-1 bg-white/20 rounded-full text-sm text-white">
                                            📍 {child.classroom}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <span>📋</span> {t('basicInfo')}
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{t('nameSurname')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {child.first_name} {child.last_name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{t('dob')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {formatDate(child.dob)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{t('age')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {calculateAge(child.dob)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{t('classroom')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {child.classroom || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{t('enrollmentDate')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {formatDate(child.created_at)}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Guardians */}
                    {child.guardians && child.guardians.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <span>👨‍👩‍👧</span> {t('guardiansInfo')}
                            </h3>
                            <div className="space-y-3">
                                {child.guardians.map((g, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <div className="font-medium text-gray-800 dark:text-white mb-1">
                                            {g.name} <span className="text-sm text-gray-500">({g.relation})</span>
                                        </div>
                                        {g.phone && (
                                            <a href={`tel:${g.phone}`} className="text-sm text-blue-600 dark:text-blue-400 block">
                                                📞 {g.phone}
                                            </a>
                                        )}
                                        {g.email && (
                                            <a href={`mailto:${g.email}`} className="text-sm text-blue-600 dark:text-blue-400 block">
                                                ✉️ {g.email}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Health */}
                    {(child.health?.allergies?.length || child.health?.notes) && (
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <span>🏥</span> {t('healthInfo')}
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                                {child.health.allergies && child.health.allergies.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('allergies')}:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {child.health.allergies.map((a, i) => (
                                                <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {child.health.notes && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('importantNotes')}:</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{child.health.notes}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Interests */}
                    {child.interests && child.interests.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <span>⭐</span> {t('interestsInfo')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {child.interests.map((interest, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Strengths */}
                    {child.strengths && child.strengths.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <span>💪</span> {t('strengthsInfo')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {child.strengths.map((strength, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                        {strength}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Teacher Observations (Shared) */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <span>👩‍🏫</span> {t('teacherObservations')}
                        </h3>
                        {loadingObs ? (
                            <div className="text-center py-4 text-gray-500">⏳ {t('loading')}</div>
                        ) : observations.length === 0 ? (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center text-gray-500 dark:text-gray-400">
                                {t('noSharedObservations')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {observations.map(obs => (
                                    <div key={obs.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{obs.note}</p>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {obs.domains.map((d, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs">
                                                    {getDomainLabel(d)}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(obs.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Empty State for no additional info */}
                    {!child.guardians?.length && !child.health?.allergies?.length && !child.health?.notes &&
                        !child.interests?.length && !child.strengths?.length && observations.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <span className="text-4xl mb-3 block">📝</span>
                                {t('noData')}
                            </div>
                        )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 p-4 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FamilyChildDetail;
