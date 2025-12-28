/**
 * FamilyInviteSection Component
 * Teacher uses this to create and manage family invite codes for a child
 */
import React, { useState, useEffect } from 'react';
import {
    createFamilyInvite,
    getFamilyLinksForChild,
    revokeFamilyLink,
    FamilyChildLink
} from '../services/api';
import { t, getDateLocale } from '../constants.clean';
import FamilyAddedContent from './FamilyAddedContent';

interface FamilyInviteSectionProps {
    childId: string;
    childName: string;
}

const FamilyInviteSection: React.FC<FamilyInviteSectionProps> = ({ childId, childName }) => {
    const [links, setLinks] = useState<FamilyChildLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newCode, setNewCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showFamilyContent, setShowFamilyContent] = useState(false);

    const loadLinks = async () => {
        setLoading(true);
        const data = await getFamilyLinksForChild(childId);
        setLinks(data);
        setLoading(false);
    };

    useEffect(() => {
        loadLinks();
    }, [childId]);

    const handleCreateInvite = async () => {
        setCreating(true);
        const result = await createFamilyInvite(childId);
        if (result) {
            setNewCode(result.invite_code);
            await loadLinks();
        }
        setCreating(false);
    };

    const handleCopyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async (linkId: string) => {
        if (!confirm(t('confirmRevokeLink'))) return;
        await revokeFamilyLink(linkId);
        await loadLinks();
    };

    const approvedLinks = links.filter(l => l.status === 'approved');
    const pendingLinks = links.filter(l => l.status === 'pending');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">👨‍👩‍👧</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('linkedFamilies')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{childName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFamilyContent(true)}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <span>📋</span>
                        {t('familyContent')}
                    </button>
                    <button
                        onClick={handleCreateInvite}
                        disabled={creating}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {creating ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <span>➕</span>
                        )}
                        {t('createInviteCode')}
                    </button>
                </div>
            </div>

            {/* New Code Display */}
            {newCode && (
                <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-teal-200 dark:border-teal-700">
                    <p className="text-sm text-teal-700 dark:text-teal-300 mb-2">{t('inviteCodeCreated')}</p>
                    <div className="flex items-center gap-3">
                        <code className="text-3xl font-mono font-bold tracking-widest text-teal-800 dark:text-teal-200 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                            {newCode}
                        </code>
                        <button
                            onClick={() => handleCopyCode(newCode)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </div>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                        {t('inviteCodeInstruction')}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : (
                <>
                    {/* Approved Links */}
                    {approvedLinks.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <span className="text-green-500">✅</span> {t('linkedFamilies')}
                            </h4>
                            <div className="space-y-2">
                                {approvedLinks.map(link => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                                <span className="text-lg">👤</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {link.relationship === 'parent' ? t('parentRole') : link.relationship}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {t('linkedOn')}: {new Date(link.created_at).toLocaleDateString(getDateLocale())}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(link.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            {t('remove')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Invites */}
                    {pendingLinks.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <span className="text-yellow-500">⏳</span> {t('pendingInvites')}
                            </h4>
                            <div className="space-y-2">
                                {pendingLinks.map(link => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <code className="font-mono font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/50 px-3 py-1 rounded">
                                                {link.invite_code}
                                            </code>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('notUsedYet')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => link.invite_code && handleCopyCode(link.invite_code)}
                                                className="px-3 py-1 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-colors text-sm"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(link.id)}
                                                className="px-3 py-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                                            >
                                                {t('cancelInvite')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {links.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">👨‍👩‍👧</div>
                            <p className="text-gray-500 dark:text-gray-400 mb-2">{t('noFamiliesLinked')}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {t('createInviteInstruction')}
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Family Added Content Modal */}
            {showFamilyContent && (
                <FamilyAddedContent
                    childId={childId}
                    childName={childName}
                    onClose={() => setShowFamilyContent(false)}
                />
            )}
        </div>
    );
};

export default FamilyInviteSection;
