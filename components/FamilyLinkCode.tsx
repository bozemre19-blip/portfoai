/**
 * FamilyLinkCode Component
 * Family users enter invite code to link with their child
 */
import React, { useState } from 'react';
import { claimInviteCode } from '../services/api';
import { t } from '../constants.clean';

interface FamilyLinkCodeProps {
    onSuccess: (childId: string) => void;
}

const FamilyLinkCode: React.FC<FamilyLinkCodeProps> = ({ onSuccess }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError(t('inviteCodeLengthError'));
            return;
        }

        setLoading(true);
        setError(null);

        const result = await claimInviteCode(code.toUpperCase());

        if (result.success && result.childId) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess(result.childId!);
            }, 2000);
        } else {
            setError(result.error || t('errorOccurred'));
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center max-w-md mx-auto">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-2">
                    {t('connectionSuccess')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('accessProfile')}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md mx-auto">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔗</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('connectWithChild')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('enterInviteCodeDesc')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="invite-code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        {t('inviteCodeLabel')}
                    </label>
                    <input
                        id="invite-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ABCD12"
                        className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] uppercase border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
                        maxLength={6}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            {t('connecting')}
                        </>
                    ) : (
                        <>
                            <span>🔗</span>
                            {t('connect')}
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    {t('inviteCodeFooter')}
                </p>
            </div>
        </div>
    );
};

export default FamilyLinkCode;
