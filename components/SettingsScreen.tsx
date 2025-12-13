
import React, { useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { t, getLanguage, setLanguage, Language } from '../constants.clean';
import { seedDemoData, removeDemoData, recomputeAssessmentsForUser, getChildren, exportChildData } from '../services/api';
import { manualSync } from '../services/syncService';
import { getOfflineQueue } from '../services/api/common';
import { SunIcon, MoonIcon, DocumentTextIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface SettingsProps {
  navigate?: (page: string, params?: any) => void;
}

const SettingsScreen: React.FC<SettingsProps> = ({ navigate }) => {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const handleThemeChange = (newTheme: string) => {
    localStorage.setItem('theme', newTheme);
    window.location.reload();
  };
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
  const defaultClassNames = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'];
  const [classNames, setClassNames] = useState<string[]>(defaultClassNames);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState('');
  const [recomputeMsg, setRecomputeMsg] = useState('');
  const [recomputing, setRecomputing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [currentLang, setCurrentLang] = useState<Language>(getLanguage());

  // Offline queue sayısını güncelle
  React.useEffect(() => {
    const updateCount = () => {
      const queue = getOfflineQueue();
      setOfflineQueueCount(queue.length);
    };

    updateCount();
    window.addEventListener('datachanged', updateCount);

    return () => window.removeEventListener('datachanged', updateCount);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
    // Reload the page to apply language changes
    window.location.reload();
  };

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

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const result = await manualSync();
      setSyncMsg(result);

      // Queue sayısını güncelle
      const queue = getOfflineQueue();
      setOfflineQueueCount(queue.length);
    } catch (e: any) {
      setSyncMsg('❌ ' + t('syncError') + ': ' + (e?.message || t('errorOccurred')));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>

      <div className="mt-8 space-y-8">
        {/* Appearance & Navigation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Görünüm ve Menü</h2>

          {/* Theme Switcher */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">🎨 {t('theme')}</div>
            <div className="flex gap-3">
              <button
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${currentTheme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => handleThemeChange('light')}
              >
                <SunIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">{t('lightTheme')}</span>
              </button>
              <button
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${currentTheme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => handleThemeChange('dark')}
              >
                <MoonIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">{t('darkTheme')}</span>
              </button>
            </div>
          </div>

          {/* Getting Started Link */}
          {navigate && (
            <button
              onClick={() => navigate('getting-started')}
              className="w-full flex items-center px-4 py-3 rounded-xl bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200 transition-all duration-200"
            >
              <DocumentTextIcon className="w-6 h-6 mr-3 text-yellow-600" />
              <span className="font-medium">{t('gettingStarted') || 'Başlarken'}</span>
            </button>
          )}
        </div>
        {/* Language Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">{t('language')}</h2>
          <p className="text-gray-600 mb-3">
            {t('changeLanguageDesc')}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentLang === 'tr' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              🇹🇷 Türkçe
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentLang === 'en' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

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
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">{t('createDemoData')}</h2>
          <p className="mt-2 text-gray-600">{t('demoDataDesc')}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm text-gray-700">{t('classCount')}</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={5} value={classCount} onChange={(e) => {
                const v = Math.max(1, Math.min(5, parseInt(e.target.value || '0') || 0));
                setClassCount(v);
              }} />
            </div>
            <div>
              <div className="text-sm text-gray-700">{t('childrenPerClass')}</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={30} value={childrenPerClass} onChange={(e) => setChildrenPerClass(parseInt(e.target.value || '0') || 0)} />
            </div>
            <div>
              <div className="text-sm text-gray-700">{t('obsPerChild')}</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={15} value={obsPerChild} onChange={(e) => setObsPerChild(parseInt(e.target.value || '0') || 0)} />
            </div>
            <div>
              <div className="text-sm text-gray-700">{t('mediaPerChild')}</div>
              <input type="number" className="border rounded px-2 py-1 w-full" min={1} max={8} value={mediaPerChild} onChange={(e) => setMediaPerChild(parseInt(e.target.value || '0') || 0)} />
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
                onChange={(e) => {
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
              onClick={async () => {
                if (!user) return;
                setSeeding(true); setSeedMsg('Başlıyor...');
                try {
                  const count = Math.max(1, Math.min(5, classCount));
                  const names = Array.from({ length: count }).map((_, i) => {
                    const v = (classNames[i] || '').trim();
                    return v || defaultClassNames[i] || `Sınıf ${i + 1}`;
                  });
                  await seedDemoData(user.id, {
                    classes: count,
                    classNames: names,
                    childrenPerClass,
                    observationsPerChild: obsPerChild,
                    mediaPerChild,
                    onProgress: (m) => setSeedMsg(m),
                  });
                  setSeedMsg('Tamamlandı.');
                } catch (e: any) {
                  setSeedMsg('Hata: ' + (e?.message || 'bilinmiyor'));
                } finally { setSeeding(false); }
              }}
            >
              {seeding ? t('creating') : t('createDemoBtn')}
            </button>
            <span className="text-xs text-gray-500">{t('demoNote')}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
              disabled={removing || !user}
              onClick={async () => {
                if (!user) return;
                if (!confirm('Demo verileri kaldırılacak. Devam edilsin mi?')) return;
                setRemoving(true); setRemoveMsg('Başlıyor...');
                try {
                  await removeDemoData(user.id, { onProgress: (m) => setRemoveMsg(m) });
                  setRemoveMsg('Tamamlandı.');
                } catch (e: any) {
                  setRemoveMsg('Hata: ' + (e?.message || 'bilinmiyor'));
                } finally { setRemoving(false); }
              }}
            >
              {removing ? t('removing') : t('removeDemoBtn')}
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">{t('aiInsights')}</h2>
          <p className="mt-2 text-gray-600">{t('aiInsightsDesc')}</p>
          {recomputeMsg && <p className="mt-2 text-sm text-gray-600">{recomputeMsg}</p>}
          <div className="mt-3 flex gap-2">
            <button
              className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-400"
              disabled={recomputing || !user}
              onClick={async () => {
                if (!user) return;
                setRecomputing(true); setRecomputeMsg('Başlıyor...');
                try {
                  await recomputeAssessmentsForUser(user.id, { onProgress: (m) => setRecomputeMsg(m) });
                  setRecomputeMsg('Tamamlandı. Çocuk sayfalarında Yenile\'ye gerek kalmadan öneriler görünür.');
                } catch (e: any) {
                  setRecomputeMsg('Hata: ' + (e?.message || 'bilinmiyor'));
                } finally { setRecomputing(false); }
              }}
            >
              {recomputing ? t('creating') : t('recomputeBtn')}
            </button>
          </div>
        </div>

        {/* Gelişmiş İşlemler - Gizli */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-xs">⚙️</span>
            <span className="font-medium">{t('advancedOps')}</span>
            <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 {t('exportToExcel')}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  {t('exportDesc')}
                  {' '}{t('exportNote')}
                </p>
                {exportMsg && <p className="text-xs text-gray-600 mb-2">{exportMsg}</p>}
                <button
                  onClick={async () => {
                    if (!user) return;
                    setExportingJSON(true);
                    setExportMsg('Veriler hazırlanıyor...');
                    try {
                      const children = await getChildren(user.id);
                      if (children.length === 0) {
                        setExportMsg('Dışa aktarılacak çocuk bulunamadı.');
                        return;
                      }

                      setExportMsg(`${children.length} çocuk verisi hazırlanıyor...`);

                      // CSV başlıkları
                      const headers = [
                        'Ad',
                        'Soyad',
                        'Doğum Tarihi',
                        'Yaş',
                        'Sınıf',
                        'Kayıt Tarihi',
                        'Veli Onayı',
                        'İlgi Alanları',
                        'Güçlü Yönler',
                        'Alerjiler',
                        'Sağlık Notları'
                      ];

                      // CSV satırları
                      const rows = children.map(child => {
                        const age = child.dob ? Math.floor((Date.now() - new Date(child.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
                        return [
                          child.first_name || '',
                          child.last_name || '',
                          child.dob || '',
                          age,
                          child.classroom || '',
                          child.created_at ? new Date(child.created_at).toLocaleDateString('tr-TR') : '',
                          child.consent_obtained ? 'Evet' : 'Hayır',
                          (child.interests || []).join(', '),
                          (child.strengths || []).join(', '),
                          (child.health?.allergies || []).join(', '),
                          child.health?.notes || ''
                        ];
                      });

                      // CSV içeriği oluştur (UTF-8 BOM ile, noktalı virgül delimiter - Türkiye için)
                      const csvContent = [
                        headers.map(h => `"${h}"`).join(';'),
                        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
                      ].join('\n');

                      // UTF-8 BOM ekle (Excel için Türkçe karakter desteği)
                      const BOM = '\uFEFF';
                      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

                      // Dosya ismini oluştur
                      const date = new Date().toISOString().split('T')[0];
                      const filename = `cocuk_listesi_${date}.csv`;

                      // İndir
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = filename;
                      link.click();
                      URL.revokeObjectURL(link.href);

                      setExportMsg(`✅ Tamamlandı! ${children.length} çocuk için Excel dosyası indirildi.`);
                    } catch (e: any) {
                      setExportMsg('❌ Hata: ' + (e?.message || 'Bilinmeyen hata'));
                    } finally {
                      setExportingJSON(false);
                    }
                  }}
                  disabled={exportingJSON || !user}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {exportingJSON ? `⏳ ${t('preparing')}` : `📊 ${t('exportBtn')}`}
                </button>
                <p className="text-xs text-gray-400 mt-2 italic">
                  {t('exportCsvNote')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Sign Out Button (Bottom) */}
      <button
        onClick={async () => {
          if (!confirm(t('signOutConfirm') || 'Çıkış yapmak istediğinize emin misiniz?')) return;
          try { await supabase.auth.signOut(); } catch { }
          try {
            sessionStorage.clear();
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && (k.startsWith('sb-') || k.includes('supabase'))) keys.push(k);
            }
            keys.forEach(k => localStorage.removeItem(k));
          } catch { }
          try { window.location.hash = ''; } catch { }
          window.location.reload();
        }}
        className="w-full px-4 py-4 mb-24 mt-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <ArrowRightOnRectangleIcon className="w-6 h-6" />
        {t('signOut')}
      </button>
    </div>
  );
};

export default SettingsScreen;

