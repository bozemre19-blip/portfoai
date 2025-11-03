import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { DEVELOPMENT_DOMAINS, t } from '../constants.clean';
import type { DevelopmentDomain, Media } from '../types';
import { addMediaRecord, deleteMedia, getMediaForChild, getSignedUrlForMedia, uploadMediaViaFunction, updateMediaViaFunction } from '../services/api';
import { TrashIcon } from './Icons';

type MediaWithUrl = Media & { url?: string };

interface MediaSectionProps {
  childId: string;
}

const MediaSection: React.FC<MediaSectionProps> = ({ childId }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<DevelopmentDomain | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<MediaWithUrl | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);

  const domainOptions = useMemo(() => Object.keys(DEVELOPMENT_DOMAINS) as DevelopmentDomain[], []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await getMediaForChild(childId);
      const withUrls: MediaWithUrl[] = await Promise.all(
        raw.map(async (m) => {
          try {
            const url = await getSignedUrlForMedia(m.storage_path, 3600);
            return { ...m, url };
          } catch {
            return m;
          }
        })
      );
      setItems(withUrls);
    } catch (e: any) {
      setError(e.message || 'Error loading media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const handler = () => fetchMedia();
    window.addEventListener('datachanged', handler);
    return () => window.removeEventListener('datachanged', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const resetForm = () => {
    setFile(null);
    setName('');
    setDescription('');
    setDomain('');
  };

  const onSave = async () => {
    if (!user || !file || !name) return;
    if (!domain) { setError((t as any)('productDomainRequired') || 'LÃ¼tfen Ã¼rÃ¼n iÃ§in bir geliÅŸim alanÄ± seÃ§in.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      // Upload via Edge Function (handles storage + DB insert)
      const { path } = await uploadMediaViaFunction(childId, file, {
        name: name.trim(),
        description: description.trim() || undefined,
        domain: (domain || undefined) as DevelopmentDomain | undefined,
      });
      setShowModal(false);
      resetForm();
      fetchMedia();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setIsSaving(false);
    }
  };

  const onOpenEdit = (m: MediaWithUrl) => {
    setEditItem(m);
    setEditFile(null);
    setName(m.name || '');
    setDescription(m.description || '');
    setDomain((m.domain || '') as any);
  };

  const onSaveEdit = async () => {
    if (!user || !editItem) return;
    if (!domain) { setError((t as any)('productDomainRequired') || 'LÃ¼tfen Ã¼rÃ¼n iÃ§in bir geliÅŸim alanÄ± seÃ§in.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await updateMediaViaFunction(editItem.id, childId, {
        name: name.trim() || editItem.name,
        description: description.trim() || undefined,
        domain: (domain || undefined) as any,
        file: editFile || undefined,
      });
      setEditItem(null);
      resetForm();
      fetchMedia();
    } catch (e: any) {
      setError(e.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (m: Media) => {
    if (!confirm(t('confirmDeleteMessage'))) return;
    try { await deleteMedia(m); fetchMedia(); } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{t('products')}</h3>
        <button onClick={() => setShowModal(true)} className="px-3 py-2 bg-primary text-white rounded-md">
          {t('uploadProduct')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading && <p className="text-sm text-gray-600">{t('loading')}</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 italic">{t('noProductsAdded')}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => (
          <div key={m.id} className="relative group border rounded-md overflow-hidden bg-gray-50">
            <button
              onClick={() => onDelete(m)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
              aria-label="delete"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onOpenEdit(m)}
              className="absolute top-2 left-2 px-2 py-1 rounded bg-white/80 text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-sm"
            >
              {t('edit')}
            </button>
            {m.url ? (
              <img src={m.url} alt={m.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-200" />
            )}
            <div className="p-3">
              <p className="font-semibold text-gray-800 truncate" title={m.name}>{m.name}</p>
              {m.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.description}</p>}
              {m.domain && (
                <span className="mt-2 inline-block text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                  {DEVELOPMENT_DOMAINS[m.domain as DevelopmentDomain]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-4">{t('uploadProduct')}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productName')}</label>
                <input className="mt-1 w-full border rounded p-2" placeholder={t('productNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productDescription')}</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={3} placeholder={t('productDescriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productDomain')}</label>
                <select className="mt-1 w-full border rounded p-2" value={domain} onChange={(e) => setDomain(e.target.value as DevelopmentDomain | '')}>
                  <option value="">{t('selectDomainPrompt')}</option>
                  {domainOptions.map((d) => (
                    <option key={d} value={d}>{DEVELOPMENT_DOMAINS[d]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('selectFile')}</label>
                <input className="mt-1 w-full" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500 mt-1">{file ? `${t('fileSelected')} ${file.name}` : t('noFileSelected')}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => { setShowModal(false); resetForm(); }} disabled={isSaving}>{t('cancel')}</button>
              <button className="px-3 py-2 bg-primary text-white rounded disabled:bg-gray-400" onClick={onSave} disabled={isSaving || !file || !name || !domain}>{isSaving ? t('loading') : t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-4">{t('edit')}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productName')}</label>
                <input className="mt-1 w-full border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productDescription')}</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('productDomain')}</label>
                <select className="mt-1 w-full border rounded p-2" value={domain} onChange={(e) => setDomain(e.target.value as DevelopmentDomain | '')}>
                  <option value="">{t('selectDomainPrompt')}</option>
                  {domainOptions.map((d) => (
                    <option key={d} value={d}>{DEVELOPMENT_DOMAINS[d]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('selectFile')}</label>
                <input className="mt-1 w-full" type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500 mt-1">{editFile ? `${t('fileSelected')} ${editFile.name}` : t('noFileSelected')}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setEditItem(null)} disabled={isSaving}>{t('cancel')}</button>
              <button className="px-3 py-2 bg-primary text-white rounded disabled:bg-gray-400" onClick={onSaveEdit} disabled={isSaving || !name || !domain}>{isSaving ? t('loading') : t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaSection;

