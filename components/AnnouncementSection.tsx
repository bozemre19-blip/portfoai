/**
 * AnnouncementSection Component
 * Teacher view for creating and managing class announcements
 */
import React, { useState, useEffect } from 'react';
import {
    getAnnouncementsForClassroom,
    createAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
    Announcement
} from '../services/api';

interface AnnouncementSectionProps {
    classroom: string;
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({ classroom }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<Priority>('normal');

    const loadAnnouncements = async () => {
        setLoading(true);
        const data = await getAnnouncementsForClassroom(classroom);
        setAnnouncements(data);
        setLoading(false);
    };

    useEffect(() => {
        if (classroom) {
            loadAnnouncements();
        }
    }, [classroom]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSaving(true);
        const result = await createAnnouncement({
            classroom,
            title: title.trim(),
            content: content.trim(),
            priority
        });

        if (result) {
            setTitle('');
            setContent('');
            setPriority('normal');
            setShowForm(false);
            await loadAnnouncements();
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
        await deleteAnnouncement(id);
        await loadAnnouncements();
    };

    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        await toggleAnnouncementPin(id, !currentPinned);
        await loadAnnouncements();
    };

    const priorityOptions: { value: Priority; label: string; icon: string }[] = [
        { value: 'low', label: 'Düşük', icon: '🔵' },
        { value: 'normal', label: 'Normal', icon: '🟢' },
        { value: 'high', label: 'Yüksek', icon: '🟠' },
        { value: 'urgent', label: 'Acil', icon: '🔴' }
    ];

    const getPriorityStyles = (p: string) => {
        switch (p) {
            case 'urgent': return 'border-red-300 bg-red-50 dark:bg-red-900/20';
            case 'high': return 'border-orange-300 bg-orange-50 dark:bg-orange-900/20';
            default: return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📢</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Duyurular</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{classroom} sınıfı</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                    <span>{showForm ? '✕' : '➕'}</span>
                    {showForm ? 'Kapat' : 'Yeni Duyuru'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Duyuru başlığı..."
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            İçerik
                        </label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Duyuru içeriği..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Öncelik
                        </label>
                        <div className="flex gap-2">
                            {priorityOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPriority(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg border-2 transition-all flex items-center gap-1 text-sm ${priority === opt.value
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <span>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {saving ? 'Yayınlanıyor...' : 'Yayınla'}
                        </button>
                    </div>
                </form>
            )}

            {/* Announcements List */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-500 dark:text-gray-400">Henüz duyuru yok</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map(ann => (
                        <div
                            key={ann.id}
                            className={`p-4 rounded-xl border-2 ${getPriorityStyles(ann.priority)}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        {ann.pinned && <span className="text-sm">📌</span>}
                                        <h4 className="font-bold text-gray-800 dark:text-white">{ann.title}</h4>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{ann.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(ann.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleTogglePin(ann.id, ann.pinned)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                                        title={ann.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                                    >
                                        {ann.pinned ? '📌' : '📍'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                        title="Sil"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementSection;
