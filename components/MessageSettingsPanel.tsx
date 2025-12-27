/**
 * MessageSettingsPanel Component
 * Teacher settings for messaging availability
 */
import React, { useState, useEffect } from 'react';
import { getMessageSettings, updateMessageSettings, MessageSettings } from '../services/api';

const MessageSettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<MessageSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getMessageSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleToggleEnabled = async () => {
        if (!settings) return;
        setSaving(true);
        await updateMessageSettings({ messaging_enabled: !settings.messaging_enabled });
        await loadSettings();
        setSaving(false);
    };

    const handleDayToggle = async (day: number) => {
        if (!settings) return;
        setSaving(true);
        const newDays = settings.available_days.includes(day)
            ? settings.available_days.filter(d => d !== day)
            : [...settings.available_days, day].sort();
        await updateMessageSettings({ available_days: newDays });
        await loadSettings();
        setSaving(false);
    };

    const handleTimeChange = async (field: 'available_start' | 'available_end', value: string) => {
        if (!settings) return;
        setSaving(true);
        await updateMessageSettings({ [field]: value });
        await loadSettings();
        setSaving(false);
    };

    const handleAutoReplyChange = async (message: string) => {
        if (!settings) return;
        await updateMessageSettings({ auto_reply_message: message || null });
        await loadSettings();
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Mesajlaşma Ayarları</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Veliler size ne zaman mesaj atabilir?</p>
                </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
                <div>
                    <p className="font-medium text-gray-800 dark:text-white">Mesajlaşma</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {settings.messaging_enabled ? 'Veliler size mesaj gönderebilir' : 'Mesajlaşma kapalı'}
                    </p>
                </div>
                <button
                    onClick={handleToggleEnabled}
                    disabled={saving}
                    className={`relative w-14 h-8 rounded-full transition-colors ${settings.messaging_enabled
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                >
                    <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.messaging_enabled ? 'left-7' : 'left-1'
                            }`}
                    />
                </button>
            </div>

            {settings.messaging_enabled && (
                <>
                    {/* Available Days */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Müsait Günler
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleDayToggle(day)}
                                    disabled={saving}
                                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${settings.available_days.includes(day)
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {dayNames[day - 1]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Başlangıç Saati
                            </label>
                            <input
                                type="time"
                                value={settings.available_start}
                                onChange={e => handleTimeChange('available_start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bitiş Saati
                            </label>
                            <input
                                type="time"
                                value={settings.available_end}
                                onChange={e => handleTimeChange('available_end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Auto Reply */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Otomatik Yanıt (Mesajlaşma Kapalıyken)
                        </label>
                        <textarea
                            value={settings.auto_reply_message || ''}
                            onChange={e => handleAutoReplyChange(e.target.value)}
                            placeholder="Örn: Mesajlaşma saatleri dışındasınız. Lütfen daha sonra tekrar deneyin."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
                        />
                    </div>
                </>
            )}

            {saving && (
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-3 text-center">
                    Kaydediliyor...
                </p>
            )}
        </div>
    );
};

export default MessageSettingsPanel;
