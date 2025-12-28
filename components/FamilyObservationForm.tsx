/**
 * FamilyObservationForm Component
 * Modal for families to add observations about their child
 */
import React, { useState } from 'react';
import { addFamilyObservation } from '../services/api';
import { getDomains, t } from '../constants.clean';

interface FamilyObservationFormProps {
    childId: string;
    childName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const FamilyObservationForm: React.FC<FamilyObservationFormProps> = ({
    childId,
    childName,
    onClose,
    onSuccess
}) => {
    const [note, setNote] = useState('');
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const domains = getDomains();

    const toggleDomain = (domainKey: string) => {
        setSelectedDomains(prev =>
            prev.includes(domainKey)
                ? prev.filter(d => d !== domainKey)
                : [...prev, domainKey]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) {
            setError(t('errorOccurred'));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await addFamilyObservation({
                child_id: childId,
                note: note.trim(),
                context: 'home',
                domains: selectedDomains
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error adding observation:', err);
            setError(err.message || t('errorOccurred'));
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-coral-500 to-orange-500 p-5 text-white" style={{ background: 'linear-gradient(to right, #f97316, #ea580c)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-xl">📝</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{t('addObservationFamily')}</h2>
                                <p className="text-orange-100 text-sm">{childName}</p>
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Note Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('familyObservationNote')} *
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t('familyObservationPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                    </div>

                    {/* Domain Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('developmentAreasOptional')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(domains).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleDomain(key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedDomains.includes(key)
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !note.trim()}
                            className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    {t('saving')}
                                </>
                            ) : (
                                <>
                                    <span>✓</span>
                                    {t('save')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyObservationForm;
