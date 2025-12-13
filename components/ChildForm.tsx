import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { t } from '../constants.clean';
import type { Child, Guardian, HealthInfo } from '../types';
import { useAuth } from '../App';
import { getClasses } from '../services/api';
import CameraCapture from './CameraCapture';
import { CameraIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ChildFormProps {
    onSave: (child: Partial<Child>) => void;
    onCancel: () => void;
    isSaving: boolean;
    initialData?: Child | null;
    formTitle: string;
}

export const ChildForm: React.FC<ChildFormProps> = ({ onSave, onCancel, isSaving, initialData, formTitle }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('basic');

    // States for all fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [classroom, setClassroom] = useState('');
    const [classOptions, setClassOptions] = useState<{ name: string }[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [consent, setConsent] = useState(false);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [allergies, setAllergies] = useState('');
    const [healthNotes, setHealthNotes] = useState('');
    const [interests, setInterests] = useState('');
    const [strengths, setStrengths] = useState('');

    // Profil fotoğrafı için state'ler
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFirstName(initialData.first_name || '');
            setLastName(initialData.last_name || '');
            setDob(initialData.dob || '');
            setClassroom(initialData.classroom || '');
            setConsent(initialData.consent_obtained || false);
            setGuardians(initialData.guardians || []);
            setAllergies(initialData.health?.allergies?.join(', ') || '');
            setHealthNotes(initialData.health?.notes || '');
            setInterests(initialData.interests?.join(', ') || '');
            setStrengths(initialData.strengths?.join(', ') || '');
            setProfilePhoto(initialData.photo_url || null);
        }
    }, [initialData]);

    useEffect(() => {
        (async () => {
            if (!user) return;
            try {
                setLoadingClasses(true);
                const list = await getClasses(user.id);
                const names = (list || []).map(c => ({ name: c.name }));
                // if editing and current classroom is not in list, include it
                if (initialData?.classroom && !names.find(n => n.name === initialData.classroom)) {
                    names.push({ name: initialData.classroom });
                }
                setClassOptions(names);
            } catch (e) {
                // Table yoksa boş bırak; kullanıcı Sınıflar ekranından oluşturabilir
                setClassOptions([]);
            } finally {
                setLoadingClasses(false);
            }
        })();
    }, [user, initialData]);

    const handleGuardianChange = (index: number, field: keyof Omit<Guardian, 'id'>, value: string) => {
        const newGuardians = [...guardians];
        const guardian = { ...newGuardians[index], [field]: value };
        if (!guardian.id) {
            guardian.id = uuidv4();
        }
        newGuardians[index] = guardian;
        setGuardians(newGuardians);
    };

    const addGuardian = () => {
        setGuardians([...guardians, { id: uuidv4(), name: '', relation: '', phone: '', email: '' }]);
    };

    const removeGuardian = (index: number) => {
        setGuardians(guardians.filter((_, i) => i !== index));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert(t('selectValidImage'));
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert(t('fileTooLarge'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            setProfilePhoto(imageData);
        };
        reader.readAsDataURL(file);
    };

    const handleCameraCapture = (imageData: string) => {
        setProfilePhoto(imageData);
    };

    const removePhoto = () => {
        setProfilePhoto(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const health: HealthInfo = {
            allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
            notes: healthNotes,
        };
        if (!classroom) {
            alert(t('selectClassFirst'));
            return;
        }
        onSave({
            first_name: firstName,
            last_name: lastName,
            dob,
            classroom,
            consent_obtained: consent,
            guardians: guardians.filter(g => g.name && g.relation),
            health,
            interests: interests.split(',').map(s => s.trim()).filter(Boolean),
            strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
            photo_url: profilePhoto || undefined,
        });
    };

    const tabs = [
        { id: 'basic', label: t('basicInfo') },
        { id: 'guardians', label: t('guardians') },
        { id: 'health', label: t('healthInfo') },
        { id: 'other', label: t('otherInfo') },
    ];

    return (
        <div className="p-6 bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg transition-colors">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{formTitle}</h3>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {activeTab === 'basic' && (
                    <div className="space-y-4">
                        {/* Profil Fotoğrafı */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">📸 {t('profilePhoto')}</label>

                            {profilePhoto ? (
                                <div className="flex items-start gap-4">
                                    <img
                                        src={profilePhoto}
                                        alt="Profil"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCamera(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
                                        >
                                            <CameraIcon className="h-5 w-5" />
                                            {t('retakePhoto')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={removePhoto}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                            {t('deletePhoto')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCamera(true)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition-all"
                                    >
                                        <CameraIcon className="h-5 w-5" />
                                        {t('takeWithCamera')}
                                    </button>
                                    <label className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-2 border-blue-200 dark:border-blue-800 rounded-lg font-medium cursor-pointer transition-all">
                                        <PhotoIcon className="h-5 w-5" />
                                        {t('uploadFromFile')}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder={t('firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} required className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            <input type="text" placeholder={t('lastName')} value={lastName} onChange={e => setLastName(e.target.value)} required className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <input type="date" placeholder={t('dob')} value={dob} onChange={e => setDob(e.target.value)} required className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('classroom')}</label>
                            <select value={classroom} onChange={e => setClassroom(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                                <option value="">— {t('selectClass')} —</option>
                                {classOptions.map((c, i) => (
                                    <option key={i} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            {(!loadingClasses && classOptions.length === 0) && (
                                <p className="text-xs text-amber-700 mt-1">{t('createClassFirst')}</p>
                            )}
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded" />
                            <label htmlFor="consent" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t('parentalConsent')}</label>
                        </div>
                    </div>
                )}

                {activeTab === 'guardians' && (
                    <div className="space-y-4">
                        {guardians.map((guardian, index) => (
                            <div key={guardian.id} className="p-3 border rounded-md space-y-2 relative dark:border-gray-700">
                                <button type="button" onClick={() => removeGuardian(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl font-bold leading-none">&times;</button>
                                <input type="text" placeholder={t('guardianName')} value={guardian.name} onChange={e => handleGuardianChange(index, 'name', e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                                <input type="text" placeholder={t('guardianRelation')} value={guardian.relation} onChange={e => handleGuardianChange(index, 'relation', e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                                <input type="tel" placeholder={t('guardianPhone')} value={guardian.phone || ''} onChange={e => handleGuardianChange(index, 'phone', e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <input type="email" placeholder={t('guardianEmail')} value={guardian.email || ''} onChange={e => handleGuardianChange(index, 'email', e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        ))}
                        <button type="button" onClick={addGuardian} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600">{t('addGuardian')}</button>
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="space-y-4">
                        <textarea placeholder={t('allergies')} value={allergies} onChange={e => setAllergies(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
                        <textarea placeholder={t('healthNotes')} value={healthNotes} onChange={e => setHealthNotes(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={4} />
                    </div>
                )}

                {activeTab === 'other' && (
                    <div className="space-y-4">
                        <textarea placeholder={t('interests')} value={interests} onChange={e => setInterests(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
                        <textarea placeholder={t('strengths')} value={strengths} onChange={e => setStrengths(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
                    </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onCancel} disabled={isSaving} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded disabled:opacity-50">{t('cancel')}</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-400">
                        {isSaving ? t('loading') : t('save')}
                    </button>
                </div>
            </form>

            {/* Kamera Modal */}
            {
                showCamera && (
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                )
            }
        </div >
    );
};

export default ChildForm;

