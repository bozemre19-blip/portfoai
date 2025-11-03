import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { getChildren, addChild, deleteChild } from '../services/api';
import type { Child } from '../types';
import { t } from '../constants.clean';
import { calculateAge } from '../utils/helpers';
import { ChildForm } from './ChildForm';
import { TrashIcon } from './Icons';

interface ChildrenScreenProps {
  navigate: (page: string, params?: any) => void;
}

const ChildrenScreen: React.FC<ChildrenScreenProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [classroomFilter, setClassroomFilter] = useState<string | undefined>(() => {
    try {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const c = params.get('classroom') || undefined;
      return c === '' ? undefined : c;
    } catch { return undefined; }
  });

  const fetchChildren = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getChildren(user.id);
      setChildren(data);
    } catch (e: any) {
      if (!e.message.includes('relation "public.children" does not exist')) {
         setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChildren();
    window.addEventListener('datachanged', fetchChildren);
    return () => {
        window.removeEventListener('datachanged', fetchChildren);
    };
  }, [fetchChildren]);
  
  const handleSaveChild = async (childData: Partial<Child>) => {
      if(!user) return;
      setIsSaving(true);
      setError(null);
      try {
          const dataToSave: Omit<Child, 'id' | 'user_id' | 'created_at'> = {
            first_name: childData.first_name || '',
            last_name: childData.last_name || '',
            dob: childData.dob || '',
            consent_obtained: childData.consent_obtained || false,
            classroom: childData.classroom,
            guardians: childData.guardians,
            health: childData.health,
            interests: childData.interests,
            strengths: childData.strengths,
            photo_url: childData.photo_url,
          };
          await addChild(dataToSave, user.id);
          setShowForm(false);
      } catch (e: unknown) {
          const getErrorMessage = (error: unknown): string => {
              if (error instanceof Error) return error.message;
              if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') return (error as any).message;
              return "Bilinmeyen bir hata oluÅŸtu.";
          };

          const errorMessage = getErrorMessage(e);
          
          if (errorMessage.includes('violates row-level security policy')) {
              setError("Kaydetme iÅŸlemi baÅŸarÄ±sÄ±z. VeritabanÄ± gÃ¼venlik kurallarÄ±nÄ±z (RLS) bu iÅŸleme izin vermiyor olabilir. LÃ¼tfen Supabase projenizdeki 'children' tablosu iÃ§in INSERT politikasÄ±nÄ± doÄŸru ÅŸekilde ayarladÄ±ÄŸÄ±nÄ±zdan emin olun.");
          } else if (errorMessage.includes('relation "public.children" does not exist')) {
              setError("Kaydetme iÅŸlemi baÅŸarÄ±sÄ±z: VeritabanÄ±nda 'children' tablosu bulunamadÄ±. LÃ¼tfen size sunulan en son SQL Kurulum Kodunu Supabase SQL Editor'de Ã§alÄ±ÅŸtÄ±rÄ±n.");
          } else {
              setError(`Ã‡ocuk kaydedilemedi. Hata: ${errorMessage}`);
          }
          
      } finally {
          setIsSaving(false);
      }
  };
  
  const handleDeleteRequest = (child: Child) => {
    setChildToDelete(child);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!childToDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteChild(childToDelete.id);
      alert(t('childDeleteSuccess'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
      setChildToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };


  const filteredChildren = children.filter(child => {
    const matchesText = `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classroomFilter ? (child.classroom || '') === classroomFilter : true;
    return matchesText && matchesClass;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('childList')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90">
            {showForm ? t('cancel') : t('addChild')}
        </button>
      </div>

      {showForm && <div className="mb-6"><ChildForm formTitle={t('addChild')} onSave={handleSaveChild} onCancel={() => setShowForm(false)} isSaving={isSaving} /></div>}
      
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded-md">{error}</p>}

      <div className="mb-4 flex flex-col gap-2">
        {classroomFilter && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 text-blue-900 rounded px-3 py-2">
            <div>Filtre: SÄ±nÄ±f = <strong>{classroomFilter || 'â€”'}</strong></div>
            <button className="text-sm underline" onClick={() => { setClassroomFilter(undefined); navigate('children'); }}>Temizle</button>
          </div>
        )}
        <input 
          type="text" 
          placeholder={t('searchChild')} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading && <p>{t('loading')}</p>}
      
      {!loading && !error && filteredChildren.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p>{t('noChildrenFound')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChildren.map((child) => (
          <div key={child.id} className="bg-white rounded-lg shadow-md p-5 transition-shadow relative group">
             <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteRequest(child); }}
                className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-opacity z-10"
                aria-label={`Delete ${child.first_name}`}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            <div onClick={() => navigate('child-detail', { id: child.id })} className="cursor-pointer">
              <div className="flex items-center space-x-4">
                 {child.photo_url ? (
                      <img src={child.photo_url} alt={`${child.first_name}`} className="w-16 h-16 rounded-full object-cover bg-gray-200" />
                  ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                          {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </div>
                  )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{child.first_name} {child.last_name}</h3>
                  <p className="text-sm text-gray-500">{t('age')}: {calculateAge(child.dob)}</p>
                  {child.classroom && <p className="text-sm text-gray-500">{t('classroom')}: {child.classroom}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isDeleteModalOpen && childToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold">{t('confirmDeleteChildTitle')}</h3>
                <p className="mt-2 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t('confirmDeleteChildMessage').replace('{childName}', `<strong>${childToDelete.first_name} ${childToDelete.last_name}</strong>`) }} />
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="px-4 py-2 bg-gray-200 rounded-md">
                        {t('cancel')}
                    </button>
                    <button onClick={handleConfirmDelete} disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded-md">
                        {isSaving ? t('deleting') : t('delete')}
                    </button>
                </div>
            </div>
        </div>
    )}
    </div>
  );
};

export default ChildrenScreen;

