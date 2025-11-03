
import React, { useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { t } from '../constants.clean';
import { seedDemoData, removeDemoData } from '../services/api';

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState<string>(user?.user_metadata?.first_name ?? '');
  const [lastName, setLastName] = useState<string>(user?.user_metadata?.last_name ?? '');
  const [schoolName, setSchoolName] = useState<string>(user?.user_metadata?.school_name ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [childrenPerClass, setChildrenPerClass] = useState(15);
  const [obsPerChild, setObsPerChild] = useState(7);
  const [mediaPerChild, setMediaPerChild] = useState(2);
  const [classCount, setClassCount] = useState(2);
  const defaultClassNames = ['Sınıf A','Sınıf B','Sınıf C','Sınıf D','Sınıf E'];
  const [classNames, setClassNames] = useState<string[]>(defaultClassNames);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          school_name: schoolName.trim(),
        },
      });
      if (error) throw error;
      setMessage(t('profileUpdateSuccess'));
      // Supabase usually emits user_updated; UI should refresh automatically.
    } catch (e: any) {
      setError(e?.message || t('errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>

      <div className="mt-8 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">{t('profile')}</h2>
          <p className="text-gray-600"><strong>{t('emailLabel')}:</strong> {user?.email}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t('teacherFirstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <input
              type="text"
              placeholder={t('teacherLastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
          <input
            type="text"
            placeholder={t('schoolName')}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="p-2 border rounded w-full"
          />

          {message && <p className="text-green-600 bg-green-100 p-2 rounded">{message}</p>}
          {error && <p className="text-red-600 bg-red-100 p-2 rounded">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-400"
            >
              {saving ? t('loading') : t('saveProfile')}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {t('signOut')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">{t('exportData')}</h2>
          <p className="mt-2 text-gray-600">
            {t('exportDataDescription')}
          </p>
          {/* Export functionality for all data could be added here */}
           <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            {t('exportAllData')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">Demo Verisi Oluştur</h2>
          <p className="mt-2 text-gray-600">Mevcut hesabınıza örnek sınıf, çocuk, gözlem ve ürün fotoğrafları ekler.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm text-gray-700">Sınıf sayısı (1–5)</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={5} value={classCount} onChange={(e)=>{
                const v = Math.max(1, Math.min(5, parseInt(e.target.value||'0')||0));
                setClassCount(v);
              }} />
            </div>
            <div>
              <div className="text-sm text-gray-700">Sınıf başına çocuk</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={30} value={childrenPerClass} onChange={(e)=>setChildrenPerClass(parseInt(e.target.value||'0')||0)} />
            </div>
            <div>
              <div className="text-sm text-gray-700">Çocuk başına gözlem</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={15} value={obsPerChild} onChange={(e)=>setObsPerChild(parseInt(e.target.value||'0')||0)} />
            </div>
            <div>
              <div className="text-sm text-gray-700">Çocuk başına ürün</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={8} value={mediaPerChild} onChange={(e)=>setMediaPerChild(parseInt(e.target.value||'0')||0)} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: classCount }).map((_, i) => (
              <input
                key={i}
                type="text"
                className="border rounded px-2 py-1 w-full"
                placeholder={defaultClassNames[i]}
                value={classNames[i] || ''}
                onChange={(e)=>{
                  const next = [...classNames];
                  next[i] = e.target.value;
                  setClassNames(next);
                }}
              />
            ))}
          </div>
          {seedMsg && <p className="mt-3 text-sm text-gray-600">{seedMsg}</p>}
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-400"
              disabled={seeding || !user}
              onClick={async ()=>{
                if (!user) return;
                setSeeding(true); setSeedMsg('Başlıyor...');
                try {
                  const count = Math.max(1, Math.min(5, classCount));
                  const names = Array.from({ length: count }).map((_, i) => {
                    const v = (classNames[i] || '').trim();
                    return v || defaultClassNames[i] || `Sınıf ${i+1}`;
                  });
                  await seedDemoData(user.id, {
                    classes: count,
                    classNames: names,
                    childrenPerClass,
                    observationsPerChild: obsPerChild,
                    mediaPerChild,
                    onProgress: (m)=>setSeedMsg(m),
                  });
                  setSeedMsg('Tamamlandı.');
                } catch (e:any) {
                  setSeedMsg('Hata: ' + (e?.message||'bilinmiyor'));
                } finally { setSeeding(false); }
              }}
            >
              {seeding ? 'Oluşturuluyor...' : 'Demo Verisini Oluştur'}
            </button>
            <span className="text-xs text-gray-500">Not: İşlem internet hızına göre zaman alabilir.</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
              disabled={removing || !user}
              onClick={async ()=>{
                if (!user) return;
                if (!confirm('Demo verileri kaldırılacak. Devam edilsin mi?')) return;
                setRemoving(true); setRemoveMsg('Başlıyor...');
                try {
                  await removeDemoData(user.id, { onProgress: (m)=>setRemoveMsg(m) });
                  setRemoveMsg('Tamamlandı.');
                } catch (e:any) {
                  setRemoveMsg('Hata: ' + (e?.message||'bilinmiyor'));
                } finally { setRemoving(false); }
              }}
            >
              {removing ? 'Kaldırılıyor...' : 'Demo Verisini Geri Al'}
            </button>
            {removeMsg && <span className="text-xs text-gray-600">{removeMsg}</span>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">{t('legal')}</h2>
          <ul className="mt-2 space-y-2 text-primary underline">
            <li>
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
                {t('privacyPolicy')}
              </a>
            </li>
            <li>
              <a href="/terms.html" target="_blank" rel="noopener noreferrer">
                {t('termsOfService')}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;

