// file: src/components/ChildDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Child, Assessment, Guardian } from '../types';
import { getObservationsForChild, getMediaForChild, updateChild, uploadChildPhoto, getAiAnalysis, addAssessmentForObservation, getSignedUrlForMedia } from '../services/api';
import { generatePdf } from './PdfReport';
import { t, DEVELOPMENT_DOMAINS } from '../constants.clean';
import { useAuth } from '../App';
import { ChildForm } from './ChildForm';
import GoalsSection from './GoalsSection';

type Risk = 'low' | 'medium' | 'high';
type ChildProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO
  classroom?: string;
  photoUrl?: string;
  consentObtained: boolean;
  enrolledAt?: string; // ISO
  guardians: Guardian[];
  health?: { allergies?: string[]; notes?: string };
  interests?: string[];
  strengths?: string[];
  lastObservationAt?: string; // ISO
  stats: { observations: number; products: number; risk?: Risk };
  aiInsights: string[];
  aiSummary?: string;
};

// Helpers
const computeRiskFromAssessment = (a: any, noteText?: string): Risk | undefined => {
  if (!a) return undefined;
  try {
    const text = String((noteText || '') + ' ' + (a?.summary || '')).toLowerCase();
    const positive = ['basar', 'heves', 'bagimsiz', 'dogru', 'katilim', 'katildi', 'surdur', 'ilerle', 'artti', 'uzun sure', 'dengede', 'yerine yerlestirdi', 'sakin', 'tamamladi'];
    const severe = ['kavga', 'vur', 'isir', 'firlat', 'kendine zarar', 'siddet', 'yaral'];
    const warn = ['zorlan', 'yardim', 'hatirlatma', 'sinirli', 'kacin', 'tereddut', 'uyari', 'desteg', 'zorluk', 'mudahale', 'huzursuz', 'odaklanamad', 'dikkati dagild', 'kurala uymadi'];
    if (severe.some(w => text.includes(w))) return 'high';
    if (positive.some(w => text.includes(w))) return 'low';
    const wc = warn.filter(w => text.includes(w)).length;
    if (wc >= 3) return 'medium';
    const ds: any = a?.domain_scores || {}; const keys = Object.keys(ds || {});
    if (keys.length) {
      const avg = keys.map(k => Number(ds[k]) || 0).reduce((s, v) => s + v, 0) / keys.length;
      if (avg >= 2.7) return 'low';
      if (avg >= 2.2) return 'medium';
      return 'high';
    }
    return (a?.risk as Risk) || 'low';
  } catch (e) {
    return (a?.risk as Risk) || undefined;
  }
}; const calculateAge = (dobIso: string): string => {
  if (!dobIso) return '—';
  const birth = new Date(dobIso);
  const now = new Date();
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) m--;
  if (m < 0) { y--; m += 12; }
  return `${y} yıl, ${m} ay`;
};

const formatDate = (isoDate?: string): string => {
  if (!isoDate) return '—';
  try { return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(isoDate)); }
  catch { return '—'; }
};

const formatDateTime = (isoDate?: string): string => {
  if (!isoDate) return '—';
  try { return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate)); }
  catch { return '—'; }
};

// Icons
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h5V6a1 1 0 011-1z" /></svg>
);
const DocumentArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.7a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg>
);
const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
);

// UI bits
const Avatar: React.FC<{ photoUrl?: string; firstName?: string; lastName?: string; className?: string }>
  = ({ photoUrl, firstName, lastName, className = 'w-24 h-24' }) => {
    const initials = `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
    return (
      <div className={`flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}>
        {photoUrl ? (
          <img src={photoUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-gray-600">{initials}</span>
        )}
      </div>
    );
  };

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>
);

const RiskBadge: React.FC<{ risk?: Risk }> = ({ risk }) => {
  const map: Record<Risk, { label: string; className: string }> = {
    low: { label: 'Düşük Risk', className: 'bg-green-100 text-green-700 ring-green-600/20' },
    medium: { label: 'Orta Risk', className: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
    high: { label: 'Yüksek Risk', className: 'bg-red-100 text-red-700 ring-red-600/20' },
  };
  const conf = risk ? map[risk] : { label: 'Belirsiz', className: 'bg-gray-100 text-gray-700 ring-gray-600/20' };
  return <Badge className={conf.className}>{conf.label}</Badge>;
};

const StatCard: React.FC<{ label: string; value: string | number; onClick?: () => void }> = ({ label, value, onClick }) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    className={`flex-1 rounded-lg bg-gray-50 px-4 py-3 text-center ${onClick ? 'cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/60 ring-1 ring-transparent transition' : ''}`}
  >
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string; onEdit?: () => void; }> = ({ title, children, className, onEdit }) => (
  <div className={`bg-white rounded-lg shadow p-6 group ${className}`}>
    <div className="flex justify-between items-center border-b pb-3 mb-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {onEdit && (
        <button onClick={onEdit} aria-label={`${title} bölümünü {t('edit')}`} className="text-gray-400 hover:text-primary p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilIcon className="w-5 h-5" />
        </button>
      )}
    </div>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 text-right">{value || '—'}</dd>
  </div>
);

const TagList: React.FC<{ tags?: string[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) return <p className="text-sm text-gray-500 italic">Henüz eklenmedi.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span key={index} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{tag}</span>
      ))}
    </div>
  );
};

const GuardianCard: React.FC<{ guardian: Guardian }> = ({ guardian }) => (
  <div className="rounded-md border p-3">
    <p className="font-semibold text-gray-800">{guardian.name} <span className="text-sm font-normal text-gray-500">({guardian.relation})</span></p>
    {guardian.phone && <a href={`tel:${guardian.phone}`} className="text-sm text-primary hover:underline block mt-1">{guardian.phone}</a>}
    {guardian.email && <a href={`mailto:${guardian.email}`} className="text-sm text-primary hover:underline block">{guardian.email}</a>}
  </div>
);

interface ChildProfileCardProps {
  data: ChildProfileData;
  onAddObservation: (childId: string) => void;
  onExportPdf: (childId: string) => void;
  onEdit: () => void;
  onChangePhoto: (file: File) => void;
  onRefreshInsights: () => void;
  onOpenMedia?: () => void;
  onOpenObservations?: () => void;
}

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ data, onAddObservation, onExportPdf, onEdit, onChangePhoto, onRefreshInsights, onOpenMedia, onOpenObservations }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar photoUrl={data.photoUrl} firstName={data.firstName} lastName={data.lastName} />
            <label className="absolute -bottom-2 right-0 bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs shadow cursor-pointer hover:bg-gray-800 text-white transition-colors">
              Fotoğrafı Değiştir
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) onChangePhoto(e.target.files[0]); }} />
            </label>
          </div>
          <div className="flex-grow text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{data.firstName} {data.lastName}</h1>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <Badge className="bg-gray-100 text-gray-700 ring-gray-600/20">{calculateAge(data.dob)}</Badge>
              {data.classroom && <Badge className="bg-gray-100 text-gray-700 ring-gray-600/20">Sınıf: {data.classroom}</Badge>}
              <Badge className="bg-gray-100 text-gray-700 ring-gray-600/20">Veli Onayı: {data.consentObtained ? 'Var' : 'Bekliyor'}</Badge>
              {/* RiskBadge removed per user request */}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => onAddObservation(data.id)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors">
                <PlusIcon className="w-5 h-5" /> Gözlem Ekle
              </button>
              <button onClick={() => onOpenMedia && onOpenMedia()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors">
                Ürünler
              </button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => onExportPdf(data.id)} title="PDF indir" aria-label="Raporu PDF olarak dışa aktar" className="flex-1 sm:flex-auto px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                <DocumentArrowDownIcon className="w-5 h-5 mx-auto" />
              </button>
              <button onClick={onEdit} aria-label="Çocuk profilini {t('edit')}" className="flex-1 sm:flex-auto px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                {t('edit')}
              </button>
              <button onClick={onRefreshInsights} aria-label="Yapay Zekâ analizini yenile" className="flex-1 sm:flex-auto px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik barı */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2 px-4 sm:px-0">
        <StatCard label="Toplam Gözlem" value={data.stats?.observations ?? '—'} onClick={() => onOpenObservations && onOpenObservations()} />
        <StatCard label="Ürün/Medya Sayısı" value={data.stats?.products ?? '—'} onClick={() => onOpenMedia && onOpenMedia()} />
        <StatCard label="Son Gözlem" value={formatDate(data.lastObservationAt)} />
      </div>
      <div className="h-4 bg-gradient-to-b from-gray-100 to-transparent rounded-b-lg mb-6" />
    </div>
  );
};

interface ChildDetailScreenProps {
  childId: string;
  navigate: (page: string, params?: any) => void;
}

const ChildDetailScreen: React.FC<ChildDetailScreenProps> = ({ childId, navigate }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ChildProfileData | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);

  const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data: childData, error: childError } = await supabase.from('children').select('*').eq('id', childId).single();
      if (childError || !childData) throw childError || new Error(t('childNotFound'));
      setChild(childData);

      const observations = await getObservationsForChild(childId);
      const media = await getMediaForChild(childId);

      const assessments = observations.map(o => ({ a: o.assessments as any, note: (o as any).note as string })).filter(x => x.a) as any[];
      const normalizedRisks: Risk[] = assessments.map(x => computeRiskFromAssessment(x.a, x.note) || 'low');
      const counts = { low: 0, medium: 0, high: 0 } as Record<Risk, number>;
      normalizedRisks.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
      let overallRisk: Risk = 'low';
      if (counts.medium >= counts.low && counts.medium >= counts.high) overallRisk = 'medium';
      else if (counts.low >= counts.medium && counts.low >= counts.high) overallRisk = 'low';
      else overallRisk = 'high';
      const lastObservation = observations.length > 0 ? observations[0] : null;

      // Öneriler: tüm değerlendirmelerden birleştirilmiş\n            // Öneriler: değerlendirmelerin tamamından benzersiz öneriler
      const dynamicInsights = Array.from(new Set((assessments || []).flatMap((x: any) => Array.isArray(x?.a?.suggestions) ? (x.a.suggestions as string[]).filter((s) => typeof s === 'string' && s.trim()) : []))).slice(0, 8);
      // Çocuğun tüm gözlemlerine dayalı genel durum değerlendirmesi (yerel özet)
      const n = observations.length;
      // En çok odaklanılan 2 beceri alanını bul
      // Legacy -> Maarif Mapping
      const domainMap: Record<string, string> = {
        'cognitive': 'math', // Bilişsel -> Matematik (Approximation)
        'language': 'turkish',
        'social_emotional': 'social',
        'fine_motor': 'motor_health',
        'gross_motor': 'motor_health',
        'self_care': 'motor_health',
        // Direct
        'turkish': 'turkish',
        'math': 'math',
        'science': 'science',
        'social': 'social',
        'motor_health': 'motor_health',
        'art': 'art',
        'music': 'music'
      };

      const domainCounts: Record<string, number> = {};
      for (const o of observations as any[]) {
        const doms = Array.isArray(o?.domains) ? (o.domains as string[]) : [];
        for (const d of doms) {
          const mapped = domainMap[d] || d; // Map legacy to new, or keep as is
          domainCounts[mapped] = (domainCounts[mapped] || 0) + 1;
        }
      }

      const topDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k]) => DEVELOPMENT_DOMAINS[k as keyof typeof DEVELOPMENT_DOMAINS] || k);

      const low = counts.low; const med = counts.medium; const high = counts.high;

      // Risk cümlesi (Daha yumuşak bir dille)
      const riskPhrase = high > 0
        ? 'belirli beceri alanlarında ek destek ihtiyacı sinyalleri mevcut'
        : med > 0
          ? 'gelişim sürecinde izlenmesi gereken alanlar var'
          : 'beceri edinimi beklenen seyrinde ilerliyor';

      // Alan cümlesi
      const domainPhrase = topDomains.length > 0
        ? `yapılan gözlemler ağırlıklı olarak **${topDomains.join('** ve **')}** üzerine yoğunlaşmıştır`
        : 'gözlem alanları dengeli bir dağılım göstermektedir';

      // Final Özet (Markdown yıldızlarını kaldırdım, düzgün görünsün)
      const aiSummary = `GENEL DURUM: Son ${n} gözlem verisine göre, ${domainPhrase}. SÜREÇ ANALİZİ: ${riskPhrase}.`;

      const data: ChildProfileData = {
        id: childData.id,
        firstName: childData.first_name,
        lastName: childData.last_name,
        dob: childData.dob,
        classroom: childData.classroom,
        photoUrl: childData.photo_url,
        consentObtained: childData.consent_obtained,
        enrolledAt: childData.created_at,
        lastObservationAt: lastObservation?.created_at,
        stats: { observations: observations.length, products: media.length, risk: overallRisk },
        guardians: childData.guardians || [],
        health: childData.health || { allergies: [], notes: '' },
        interests: childData.interests || [],
        strengths: childData.strengths || [],
        aiInsights: dynamicInsights, // Sadece öneriler kalsın
        aiSummary, // Özeti ayrıca geçiyoruz
      };

      setProfileData(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [childId, user]);

  useEffect(() => {
    fetchData();
    window.addEventListener('datachanged', fetchData);
    return () => window.removeEventListener('datachanged', fetchData);
  }, [fetchData]);

  const handleExportPdf = async (id: string) => {
    try {
      let childData: any | null = null;
      if (child && child.id === id) childData = child; else {
        const { data, error } = await supabase.from('children').select('*').eq('id', id).single();
        if (error || !data) throw error || new Error(t('childNotFound'));
        childData = data;
      }
      const observations = await getObservationsForChild(id);
      const mediaRaw = await getMediaForChild(id);
      const mediaWithUrls = await Promise.all((mediaRaw || []).map(async (m: any) => {
        try { const url = await getSignedUrlForMedia(m.storage_path, 3600); return { ...m, url }; } catch { return m; }
      }));
      await generatePdf(childData as any, observations as any, mediaWithUrls as any, `${user?.user_metadata?.first_name ?? ''} ${user?.user_metadata?.last_name ?? ''}`.trim(), user?.user_metadata?.school_name ?? '');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || t('errorOccurred'));
    }
  };

  const handleChangePhoto = async (file: File) => {
    if (!child || !user) return;
    try {
      setIsSaving(true);
      const url = await uploadChildPhoto(user.id, child.id, file);
      await updateChild(child.id, { photo_url: url });
    } catch (e) {
      console.error(e);
      alert(t('errorOccurred'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshInsights = async () => {
    if (!user) return;
    try {
      setIsRefreshingInsights(true);
      const obs = await getObservationsForChild(childId);
      const serverObs = (obs as any[]).filter(o => !(o as any).dirty);
      const toRecompute = serverObs.filter((o: any) => {
        if (!o.assessments) return true;
        const sum = String(o.assessments.summary || '');
        return sum.startsWith('Bu, yapay zeka servisi');
      });
      const insightSet = new Set<string>();
      for (const o of toRecompute) {
        try {
          const analysis = await getAiAnalysis(o.note, o.domains as any);
          if (Array.isArray(analysis.suggestions)) {
            for (const s of analysis.suggestions) if (typeof s === 'string' && s.trim()) insightSet.add(s.trim());
          }
          await addAssessmentForObservation(o.id, user.id, { summary: analysis.summary, risk: analysis.risk as any, suggestions: analysis.suggestions || [], domain_scores: analysis.domain_scores as any });
        } catch (err) { console.error('AI recompute failed for observation', o.id, err); }
      }
      if (insightSet.size > 0 && profileData) setProfileData({ ...profileData, aiInsights: Array.from(insightSet).slice(0, 5) });
      await fetchData();
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const handleUpdateChild = async (updates: Partial<Child>) => {
    if (!child) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateChild(child.id, updates);
      setIsEditModalOpen(false);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally { setIsSaving(false); }
  };

  if (loading) return <p>{t('loading')}</p>;
  if (error) return <p className="text-red-500 my-4 bg-red-100 p-3 rounded-md">{error}</p>;
  if (!profileData) return <p>{t('childNotFound')}</p>;

  return (
    <>
      <ChildProfileCard
        data={profileData}
        onAddObservation={() => navigate('add-observation', { childId })}
        onExportPdf={handleExportPdf}
        onEdit={() => setIsEditModalOpen(true)}
        onChangePhoto={handleChangePhoto}
        onRefreshInsights={handleRefreshInsights}
        onOpenMedia={() => navigate('media', { childId })}
        onOpenObservations={() => navigate('child-observations', { childId })}
      />

      {/* Alt Bilgiler */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Section title="Temel Bilgiler" onEdit={() => setIsEditModalOpen(true)}>
            <InfoRow label="Ad Soyad" value={`${profileData.firstName} ${profileData.lastName}`} />
            <InfoRow label="Doğum Tarihi" value={formatDate(profileData.dob)} />
            <InfoRow label="Yaş" value={calculateAge(profileData.dob)} />
            <InfoRow label="Sınıf" value={profileData.classroom || '—'} />
            <InfoRow label="Kayıt Tarihi" value={formatDate(profileData.enrolledAt)} />
          </Section>
          <Section title="İlgi Alanları">
            <TagList tags={profileData.interests} />
          </Section>
          <Section title="Güçlü Yönler">
            <TagList tags={profileData.strengths} />
          </Section>
        </div>
        {/* Sağ */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Section title="Veli ve İletişim Bilgileri">
            {profileData.guardians && profileData.guardians.length > 0 ? (
              <div className="space-y-3">{profileData.guardians.map((g, i) => <GuardianCard key={i} guardian={g} />)}</div>
            ) : (
              <p className="text-sm text-gray-500 italic">Veli bilgisi eklenmemiş.</p>
            )}
          </Section>
          <Section title="Sağlık Bilgileri">
            <div>
              <h4 className="font-semibold text-gray-700">Alerjiler</h4>
              <TagList tags={(profileData.health?.allergies as any) || []} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Önemli Notlar</h4>
              <p className="text-sm text-gray-600 mt-1">{profileData.health?.notes || '—'}</p>
            </div>
          </Section>
          <Section title="Yapay Zekâ Öngörüleri">
            {profileData.aiSummary && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-md shadow-sm ai-summary-container">
                <p className="text-sm text-indigo-900 leading-relaxed font-medium">{profileData.aiSummary}</p>
              </div>
            )}
            {profileData.aiInsights && profileData.aiInsights.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">{profileData.aiInsights.map((s, i) => <li key={i}>{s}</li>)}</ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Analiz edilecek yeterli gözlem yok.</p>
            )}
          </Section>
        </div>
      </div>

      {/* Hedefler Bölümü */}
      <div className="mt-8">
        <GoalsSection childId={childId} userId={user?.id || ''} />
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <ChildForm
              formTitle={t('editChild')}
              initialData={child}
              isSaving={isSaving}
              onSave={handleUpdateChild}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChildDetailScreen;
