/**
 * TeacherAnnouncementsScreen Component
 * Full screen for teachers to manage announcements
 * Supports both class-wide and child-specific announcements
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    createAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
    Announcement
} from '../services/api';
import { MegaphoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { t } from '../constants.clean';

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    classroom: string;
}

interface TeacherAnnouncementsScreenProps {
    navigate: (page: string, params?: any) => void;
}

type AnnouncementType = 'class' | 'child';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

const TeacherAnnouncementsScreen: React.FC<TeacherAnnouncementsScreenProps> = ({ navigate }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [announcementType, setAnnouncementType] = useState<AnnouncementType>('class');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [selectedChildId, setSelectedChildId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<Priority>('normal');

    const loadData = async () => {
        setLoading(true);

        // Get user's children
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: childrenData } = await supabase
            .from('children')
            .select('id, first_name, last_name, classroom')
            .eq('user_id', user.id);

        setChildren(childrenData || []);

        // Extract unique classrooms
        const uniqueClassrooms = [...new Set((childrenData || [])
            .map(c => c.classroom)
            .filter(Boolean))] as string[];
        setClassrooms(uniqueClassrooms);

        if (uniqueClassrooms.length > 0 && !selectedClassroom) {
            setSelectedClassroom(uniqueClassrooms[0]);
        }

        // Get all announcements by this teacher
        const { data: announcementsData } = await supabase
            .from('announcements')
            .select('*')
            .eq('user_id', user.id)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false });

        setAnnouncements(announcementsData || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSaving(true);

        const result = await createAnnouncement({
            classroom: announcementType === 'child'
                ? children.find(c => c.id === selectedChildId)?.classroom || selectedClassroom
                : selectedClassroom,
            child_id: announcementType === 'child' ? selectedChildId : null,
            title: title.trim(),
            content: content.trim(),
            priority
        });

        if (result) {
            setTitle('');
            setContent('');
            setPriority('normal');
            setShowForm(false);
            await loadData();
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
        await deleteAnnouncement(id);
        await loadData();
    };

    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        await toggleAnnouncementPin(id, !currentPinned);
        await loadData();
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

    const getChildName = (childId: string | null) => {
        if (!childId) return null;
        const child = children.find(c => c.id === childId);
        return child ? `${child.first_name} ${child.last_name}` : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MegaphoneIcon className="w-8 h-8 text-orange-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('announcements')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('announcementsDesc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setAnnouncementType('class');
                        setTitle('');
                        setContent('');
                        setPriority('normal');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('newAnnouncement')}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg space-y-4 border border-gray-100 dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duyuru Türü
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAnnouncementType('class')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${announcementType === 'class'
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-2xl mb-2 block">🏫</span>
                                <span className="font-medium text-gray-800 dark:text-white">Sınıf Duyurusu</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Tüm sınıf velilerine gider
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAnnouncementType('child')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${announcementType === 'child'
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-2xl mb-2 block">👶</span>
                                <span className="font-medium text-gray-800 dark:text-white">Çocuk Duyurusu</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Sadece o çocuğun velisine gider
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div>
                        {announcementType === 'class' ? (
                            <>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sınıf Seçin
                                </label>
                                <select
                                    value={selectedClassroom}
                                    onChange={e => setSelectedClassroom(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    required
                                >
                                    {classrooms.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Çocuk Seçin
                                </label>
                                <select
                                    value={selectedChildId}
                                    onChange={e => setSelectedChildId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    required
                                >
                                    <option value="">Çocuk seçin...</option>
                                    {children.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.first_name} {c.last_name} ({c.classroom})
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Duyuru başlığı..."
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            İçerik
                        </label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Duyuru içeriği..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                            required
                        />
                    </div>

                    {/* Priority */}
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

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving || (announcementType === 'child' && !selectedChildId)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {saving ? 'Yayınlanıyor...' : 'Yayınla'}
                        </button>
                    </div>
                </form>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Henüz duyuru yok</h3>
                    <p className="text-gray-500 dark:text-gray-400">Yeni duyuru oluşturmak için butona tıklayın</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(ann => (
                        <div
                            key={ann.id}
                            className={`p-5 rounded-2xl border-2 shadow-sm ${getPriorityStyles(ann.priority)}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {ann.pinned && <span className="text-sm">📌</span>}
                                        <h4 className="font-bold text-gray-800 dark:text-white">{ann.title}</h4>
                                        {/* Badge for type */}
                                        {ann.child_id ? (
                                            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                👶 {getChildName(ann.child_id)}
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                🏫 {ann.classroom}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{ann.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(ann.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleTogglePin(ann.id, ann.pinned)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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

export default TeacherAnnouncementsScreen;
