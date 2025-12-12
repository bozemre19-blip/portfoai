/**
 * Demo Data Seeder
 * Hızlıca test verisi oluşturmak için kullanılır
 */

import { supabase } from '../supabase';
import type { Child, DevelopmentDomain, ObservationContext } from '../../types';
import { createClass } from './classes';
import { addChild, updateChild, deleteChild } from './children';
import { addObservation } from './observations';
import { addAssessmentForObservation } from './assessments';
import { uploadMedia, addMediaRecord } from './media';
import { dispatchDataChangedEvent } from './common';
import { v4 as uuidv4 } from 'uuid';
import { getLanguage } from '../../constants.clean';

export type SeedOptions = {
  classNames?: string[];
  classes?: number;
  childrenPerClass?: number;
  observationsPerChild?: number;
  mediaPerChild?: number;
  onProgress?: (msg: string) => void;
};

type SeedRecord = {
  time: string;
  classes: string[];
  children: string[];
  observations: string[];
  media: string[];
};

// Yardımcı fonksiyonlar
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickManyUnique = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

// Türkçe isim havuzları
const turkishFirstNames = ['Emir', 'Ali', 'Eymen', 'Mert', 'Kerem', 'Aras', 'Deniz', 'Atlas', 'Can', 'Yiğit', 'Eylül', 'Zeynep', 'Elif', 'Defne', 'Asel', 'Naz', 'Mira', 'Ada', 'Ecrin', 'Lina'];
const turkishLastNames = ['Yılmaz', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Arslan', 'Doğan', 'Kaya', 'Koç', 'Polat', 'Işık', 'Uzun'];
const adultFirstNamesTR = ['Ayşe', 'Fatma', 'Zehra', 'Merve', 'Seda', 'Derya', 'Gizem', 'Tuğba', 'Esra', 'Pelin', 'Ahmet', 'Mehmet', 'Mustafa', 'Emre', 'Hakan', 'Cem', 'Caner', 'Serkan', 'Murat', 'Burak'];
const adultLastNamesTR = ['Kara', 'Yalçın', 'Korkmaz', 'Şimşek', 'Özkan', 'Aksoy', 'Taş', 'Yurt', 'Türkmen', 'Duman', 'Özdemir', 'Taşdemir'];
const guardianRelationsTR = ['Anne', 'Baba', 'Veli', 'Teyze', 'Amca'];
const allergyPoolTR = ['Yumurta', 'Fıstık', 'Süt', 'Gluten', 'Polen', 'Arı', 'Domates', 'Kivi'];
const interestPoolTR = ['lego', 'resim', 'müzik', 'hikaye', 'bahçe', 'drama', 'dans', 'bilmece', 'yapboz', 'matematik oyunları'];
const strengthPoolTR = ['paylaşımcı', 'sabırlı', 'yaratıcı', 'iletişimi kuvvetli', 'detaycı', 'sebatlı', 'meraklı'];

// English name pools
const englishFirstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Sophia', 'Elijah', 'Isabella', 'James', 'Mia', 'William', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'];
const englishLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];
const adultFirstNamesEN = ['Sarah', 'Michael', 'Jennifer', 'David', 'Emily', 'Robert', 'Jessica', 'John', 'Ashley', 'Christopher', 'Amanda', 'Daniel', 'Stephanie', 'Matthew', 'Nicole', 'Andrew', 'Elizabeth', 'Joshua', 'Megan', 'Ryan'];
const adultLastNamesEN = ['Wilson', 'White', 'Harris', 'Martin', 'Thompson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young'];
const guardianRelationsEN = ['Mother', 'Father', 'Guardian', 'Aunt', 'Uncle'];
const allergyPoolEN = ['Eggs', 'Peanuts', 'Milk', 'Gluten', 'Pollen', 'Bee', 'Tomato', 'Kiwi'];
const interestPoolEN = ['lego', 'drawing', 'music', 'stories', 'gardening', 'drama', 'dance', 'puzzles', 'jigsaw', 'math games'];
const strengthPoolEN = ['sharing', 'patient', 'creative', 'good communicator', 'detail-oriented', 'persistent', 'curious'];

// Language-aware getters
const getFirstNames = () => getLanguage() === 'en' ? englishFirstNames : turkishFirstNames;
const getLastNames = () => getLanguage() === 'en' ? englishLastNames : turkishLastNames;
const getAdultFirstNames = () => getLanguage() === 'en' ? adultFirstNamesEN : adultFirstNamesTR;
const getAdultLastNames = () => getLanguage() === 'en' ? adultLastNamesEN : adultLastNamesTR;
const getGuardianRelations = () => getLanguage() === 'en' ? guardianRelationsEN : guardianRelationsTR;
const getAllergyPool = () => getLanguage() === 'en' ? allergyPoolEN : allergyPoolTR;
const getInterestPool = () => getLanguage() === 'en' ? interestPoolEN : interestPoolTR;
const getStrengthPool = () => getLanguage() === 'en' ? strengthPoolEN : strengthPoolTR;

// Gözlem bağlamı metinleri
const ctxTextTR: Record<ObservationContext, string> = {
  classroom: 'sınıf içinde',
  outdoor: 'bahçede',
  home: 'ev ortamında',
  other: 'etkinlik sırasında',
};
const ctxTextEN: Record<ObservationContext, string> = {
  classroom: 'in classroom',
  outdoor: 'in the garden',
  home: 'at home',
  other: 'during activity',
};
const getCtxText = () => getLanguage() === 'en' ? ctxTextEN : ctxTextTR;

// Gelişim alanlarına göre aktiviteler (MEB 7 Alan - olumlu + dikkat gerektiren) - Türkçe
const domainActivitiesTR: Record<DevelopmentDomain, string[]> = {
  turkish: [
    'hikâyedeki olayları kendi sözleriyle özetledi',
    'görsellerden çıkarım yaparak soruları yanıtladı',
    'yeni kelimeleri cümle içinde kullanmayı denedi',
    'akranıyla sohbeti başlatıp sürdürdü',
    'tekerlemeli şarkıları ritmik olarak söyledi',
    'hikâyeyi özetlerken sınırlı kelime kullandı',
    'sorulara tek kelimelik cevaplar verdi',
    'iletişim kurmakta çekingen davrandı',
    'kendini ifade etmede zorlandı',
  ],
  math: [
    'eşleştirme oyununda doğru bağlantılar kurdu',
    'sayı sıralamasını doğru bir şekilde yaptı',
    'geometrik şekilleri tanıdı ve sınıflandırdı',
    'basit örüntüleri tamamladı',
    'ölçme ve tartma kavramlarını anladı',
    'sayıları karıştırdı, yeniden çalışması gerekti',
    'şekil sınıflama görevinde zorlandı',
    'örüntü tamamlamada tereddüt etti',
    'ölçme kavramlarını anlamakta güçlük çekti',
  ],
  science: [
    'doğa gözleminde merak sorularını ifade etti',
    'basit deneyi adımlarıyla takip etti',
    'bitki büyümesi sürecini izledi ve kayıt etti',
    'hava durumu değişikliklerini fark etti',
    'canlı-cansız ayrımını doğru yaptı',
    'deney adımlarını takip etmede zorlandı',
    'gözlem yapmakta dikkatini verme zorluğu yaşadı',
    'neden-sonuç ilişkilerini kurmakta güçlük çekti',
    'sorulara ilgisiz kaldı',
  ],
  social: [
    'sıra beklerken sabırlı davrandı',
    'arkadaşına materyal uzatarak iş birliği yaptı',
    'duygusunu sözel olarak ifade etti',
    'oyunda basit çatışmayı konuşarak çözdü',
    'kurallara uyma konusunda olumlu tutum gösterdi',
    'sıra beklerken huzursuz oldu',
    'paylaşım konusunda isteksiz davrandı',
    'arkadaşıyla anlaşmazlık yaşadı',
    'duygusal olarak tepkili davrandı',
    'oyuncak paylaşımında güçlük çekti',
  ],
  motor_health: [
    'topu hedefe doğru gönderdi ve yakaladı',
    'denge tahtasında kontrollü yürüdü',
    'makasla çizgi boyunca dikkatle kesti',
    'boncukları ipe geçirirken iki el koordinasyonu kullandı',
    'ellerini adım adım doğru yıkadı',
    'giyinme sırasında fermuarını kapatmayı denedi',
    'top yakalamada koordinasyon eksikliği gösterdi',
    'denge tutmakta zorlandı',
    'makasla kesmede el koordinasyonu zayıf',
    'el yıkamayı hatırlatmaya ihtiyaç duydu',
  ],
  art: [
    'resim çalışmasında renkleri özgürce kullandı',
    'hamur ile üç boyutlu şekiller oluşturdu',
    'kolaj çalışmasını tamamladı',
    'çizimlerinde detay ve ifade arttı',
    'yeni malzemeleri denemekten keyif aldı',
    'sanat etkinliğine katılımda isteksiz davrandı',
    'malzemeleri kullanmakta zorlandı',
    'çizimde özgüven eksikliği gösterdi',
    'renk seçiminde kararsız kaldı',
  ],
  music: [
    'şarkılarını ritimle ve enerjik söyledi',
    'ritim aletlerini doğru kullandı',
    'müzik eşliğinde hareket etti',
    'melodileri tanıdı ve taklit etti',
    'dans ederken ritme uyum sağladı',
    'ritim tutmakta zorlandı',
    'şarkı söylemekten kaçındı',
    'müzik etkinliğine katılmakta çekingen davrandı',
    'ritim aletlerini kullanmada güçlük çekti',
  ],
};

// English domain activities
const domainActivitiesEN: Record<DevelopmentDomain, string[]> = {
  turkish: [
    'summarized story events in their own words',
    'answered questions by making inferences from visuals',
    'tried using new words in sentences',
    'initiated and maintained conversation with peers',
    'sang rhyming songs rhythmically',
    'used limited vocabulary when summarizing the story',
    'gave single-word answers to questions',
    'was hesitant in communication',
    'had difficulty expressing themselves',
  ],
  math: [
    'made correct connections in matching games',
    'correctly sequenced numbers',
    'recognized and classified geometric shapes',
    'completed simple patterns',
    'understood measuring and weighing concepts',
    'confused numbers, needed more practice',
    'struggled with shape classification task',
    'hesitated in pattern completion',
    'had difficulty understanding measurement concepts',
  ],
  science: [
    'expressed curiosity questions during nature observation',
    'followed experiment steps correctly',
    'observed and recorded plant growth process',
    'noticed weather changes',
    'correctly distinguished living and non-living things',
    'struggled to follow experiment steps',
    'had difficulty paying attention during observation',
    'struggled to establish cause-effect relationships',
    'showed disinterest in questions',
  ],
  social: [
    'showed patience while waiting in line',
    'cooperated by passing materials to friends',
    'expressed emotions verbally',
    'resolved simple conflicts through discussion',
    'showed positive attitude towards following rules',
    'became restless while waiting in line',
    'was reluctant to share',
    'had disagreement with friend',
    'reacted emotionally',
    'had difficulty sharing toys',
  ],
  motor_health: [
    'threw and caught ball towards target',
    'walked on balance beam with control',
    'cut along lines carefully with scissors',
    'used two-hand coordination while threading beads',
    'washed hands correctly step by step',
    'tried to close zipper while dressing',
    'showed coordination deficiency in catching ball',
    'struggled to maintain balance',
    'weak hand coordination when cutting with scissors',
    'needed reminders for hand washing',
  ],
  art: [
    'used colors freely in painting activity',
    'created three-dimensional shapes with playdough',
    'completed collage work',
    'increased detail and expression in drawings',
    'enjoyed trying new materials',
    'was reluctant to participate in art activity',
    'struggled to use materials',
    'showed lack of confidence in drawing',
    'was indecisive about color selection',
  ],
  music: [
    'sang songs rhythmically and energetically',
    'used rhythm instruments correctly',
    'moved along with music',
    'recognized and imitated melodies',
    'synchronized with rhythm while dancing',
    'struggled to keep rhythm',
    'avoided singing',
    'was hesitant to participate in music activity',
    'had difficulty using rhythm instruments',
  ],
};

const getDomainActivities = () => getLanguage() === 'en' ? domainActivitiesEN : domainActivitiesTR;

const adverbsTR = ['dikkatle', 'hevesle', 'sakin bir şekilde', 'kısa hatırlatma ile', 'bağımsız', 'tereddütle', 'çekinerek', 'zorlanarak', 'yardımla'];
const adverbsEN = ['carefully', 'eagerly', 'calmly', 'with a brief reminder', 'independently', 'hesitantly', 'shyly', 'with difficulty', 'with help'];
const getAdverbs = () => getLanguage() === 'en' ? adverbsEN : adverbsTR;

const closersTR = [
  'Süre boyunca odağını korudu.',
  'Modelleme sonrasında denemeye devam etti.',
  'Akran desteğiyle görevi tamamladı.',
  'Önceki haftaya göre daha uzun süre katılım sağladı.',
  'Dikkati dağılarak sık sık ara verdi.',
  'Görev yarıda kaldı.',
  'Desteğe ihtiyaç duydu.',
  'Müdahale gerekti.',
];
const closersEN = [
  'Maintained focus throughout.',
  'Continued to try after modeling.',
  'Completed task with peer support.',
  'Participated longer compared to last week.',
  'Took frequent breaks due to distraction.',
  'Task was left incomplete.',
  'Needed support.',
  'Intervention was required.',
];
const getClosers = () => getLanguage() === 'en' ? closersEN : closersTR;

// Alan bazlı öneriler (MEB 7 Alan) - Türkçe
const domainSuggestionsTR: Record<DevelopmentDomain, string[]> = {
  turkish: [
    'Günlük rutinde açık uçlu sorular sorun ve yanıtları genişletin.',
    'Günlük bir kitap okuma saati belirleyin ve resimlerden çıkarım yaptırın.',
    'Yeni kelimeleri gün içinde cümle içinde kullanmasını teşvik edin.',
  ],
  math: [
    'Eşleştirme ve sınıflama oyunlarına kısa günlük oturumlar ekleyin.',
    'Sayı sayma ve sıralama etkinlikleri yapın.',
    'Geometrik şekilleri günlük hayatta göstermeye çalışın.',
  ],
  science: [
    'Doğa yürüyüşlerinde gözlem soruları sorun.',
    'Basit deneyler yaparak merakını destekleyin.',
    'Bitki yetiştirme projesi başlatın.',
  ],
  social: [
    'Sıra bekleme ve paylaşım içeren işbirlikli oyunlar planlayın.',
    'Duygularını ifade edebileceği "duygu kartları" kullanın.',
    'Rol oyunu ile çatışmaları konuşarak çözme pratikleri yapın.',
  ],
  motor_health: [
    'Denge tahtası, sek sek ve hedefe atma oyunlarına zaman ayırın.',
    'El yıkama adımlarını posterle hatırlatın ve pekiştirin.',
    'Makasla çizgi boyunca kesme ve ince motor çalışmaları yapın.',
  ],
  art: [
    'Farklı sanat malzemeleriyle deneyler yapmasına fırsat verin.',
    'Özgür resim çalışmaları için zaman ayırın.',
    'Üç boyutlu çalışmalar (hamur, kil) ile yaratıcılığı destekleyin.',
  ],
  music: [
    'Günlük ritim ve şarkı aktiviteleri ekleyin.',
    'Basit ritim aletleri kullanarak müzik yapmasını teşvik edin.',
    'Dans ve hareket etkinlikleriyle müziği birleştirin.',
  ],
};

// English domain suggestions
const domainSuggestionsEN: Record<DevelopmentDomain, string[]> = {
  turkish: [
    'Ask open-ended questions in daily routine and expand responses.',
    'Set a daily reading time and encourage inferences from pictures.',
    'Encourage using new words in sentences throughout the day.',
  ],
  math: [
    'Add short daily sessions of matching and classification games.',
    'Do counting and sequencing activities.',
    'Try to show geometric shapes in daily life.',
  ],
  science: [
    'Ask observation questions during nature walks.',
    'Support curiosity by doing simple experiments.',
    'Start a plant growing project.',
  ],
  social: [
    'Plan cooperative games involving waiting in line and sharing.',
    'Use "emotion cards" to help express feelings.',
    'Practice resolving conflicts through role play.',
  ],
  motor_health: [
    'Dedicate time to balance beam, hopscotch and target games.',
    'Remind and reinforce hand washing steps with posters.',
    'Do cutting along lines and fine motor activities with scissors.',
  ],
  art: [
    'Give opportunities to experiment with different art materials.',
    'Allow time for free drawing activities.',
    'Support creativity with 3D work (playdough, clay).',
  ],
  music: [
    'Add daily rhythm and song activities.',
    'Encourage making music using simple rhythm instruments.',
    'Combine music with dance and movement activities.',
  ],
};

const getDomainSuggestions = () => getLanguage() === 'en' ? domainSuggestionsEN : domainSuggestionsTR;

const domainList: DevelopmentDomain[] = ['turkish', 'math', 'science', 'social', 'motor_health', 'art', 'music'];
const contextList: ObservationContext[] = ['classroom', 'outdoor', 'home', 'other'];

// Gözlem notu oluştur (çeşitli risk seviyeleriyle)
const makeObservationNote = (fullName: string, domains: DevelopmentDomain[], context: ObservationContext, targetRisk?: 'low' | 'medium' | 'high'): string => {
  const parts: string[] = [];
  const ctx = getCtxText()[context] || (getLanguage() === 'en' ? 'during activity' : 'etkinlikte');
  const dom = pick(domains);
  const activities = getDomainActivities()[dom];

  // Risk seviyesine göre aktivite seç
  let act: string;
  if (targetRisk === 'high') {
    // Olumsuz aktiviteler (ikinci yarı)
    const negativeActs = activities.slice(Math.ceil(activities.length / 2));
    act = pick(negativeActs);
  } else if (targetRisk === 'medium') {
    // Karışık
    act = pick(activities);
  } else {
    // Olumlu aktiviteler (ilk yarı)
    const positiveActs = activities.slice(0, Math.ceil(activities.length / 2));
    act = pick(positiveActs);
  }

  const adv = pick(getAdverbs());
  parts.push(`${ctx} ${act} (${adv}).`);

  if (Math.random() < 0.6) parts.push(pick(getClosers()));
  const observedText = getLanguage() === 'en' ? `${fullName} was observed today.` : `${fullName} bugün gözlemlendi.`;
  if (Math.random() < 0.4) parts.unshift(observedText);

  return parts.join(' ');
};

// Hızlı AI benzeri değerlendirme (gerçek AI çağırmadan, demo için)
const makeSeedAssessment = (note: string, domains: DevelopmentDomain[]) => {
  const text = (note || '').toLocaleLowerCase('tr-TR');
  const positives = ['başar', 'heves', 'bağımsız', 'doğru', 'katılım', 'katıldı', 'sürdür', 'ilerle', 'arttı', 'paylaş', 'işbirliği', 'sakin', 'dikkatle', 'düzenli'];
  const warnings = ['zorlan', 'yardım', 'hatırlatma', 'az', 'sınırlı', 'kaçın', 'tereddüt', 'uyarı', 'desteğe', 'zorluk', 'müdahale', 'huzursuz', 'odaklanamad', 'dikkati dağıld', 'kurala uymadı'];
  const severe = ['kavga', 'vur', 'ısır', 'fırlatt', 'kendine zarar', 'şiddet', 'yaral'];

  const posCount = positives.filter((w) => text.includes(w)).length;
  const warnCount = warnings.filter((w) => text.includes(w)).length;
  const severeHit = severe.some((w) => text.includes(w));

  let risk: 'low' | 'medium' | 'high';
  if (severeHit && posCount === 0) {
    risk = 'high';
  } else if ((warnCount >= 2 && posCount === 0) || warnCount >= 3) {
    risk = 'medium';
  } else {
    risk = 'low';
  }

  const domain_scores: Record<string, number> = {};
  for (const d of domains) {
    if (risk === 'high') domain_scores[d] = rand(1, 2);
    else if (risk === 'medium') domain_scores[d] = rand(2, 3);
    else domain_scores[d] = rand(3, 5);
  }

  const pool: string[] = [];
  for (const d of domains) pool.push(...getDomainSuggestions()[d]);
  if (pool.length < 3) pool.push(...Object.values(getDomainSuggestions()).flat());
  const suggestions = pickManyUnique(pool, 3);

  const trRisk = risk === 'low' ? 'düşük' : risk === 'medium' ? 'orta' : 'yüksek';
  const domainText = domains
    .map((d) =>
      d === 'turkish' ? 'Türkçe' : d === 'math' ? 'Matematik' : d === 'science' ? 'Fen' : d === 'social' ? 'Sosyal' : d === 'motor_health' ? 'Hareket ve Sağlık' : d === 'art' ? 'Sanat' : 'Müzik'
    )
    .join(', ');
  const summary = `Durum değerlendirmesi: Son gözlemde ${domainText} alanlarında katılım değerlendirildi. Genel risk: ${trRisk}.`;

  return { summary, domain_scores, risk, suggestions };
};

// Diğer yardımcı fonksiyonlar
const makeDob = (): string => {
  const now = new Date();
  const year = now.getFullYear() - rand(3, 6);
  const month = rand(1, 12);
  const day = rand(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const makePhone = () => `+90 5${rand(0, 9)}${rand(0, 9)} ${rand(100, 999)} ${rand(10, 99)} ${rand(10, 99)}`;
const makeEmail = (name: string, last: string) =>
  `${name}.${last}${rand(1, 99)}@ornekmail.com`
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const pickAdultName = () => ({ f: pick(getAdultFirstNames()), l: pick(getAdultLastNames()) });

const makeChildMeta = () => {
  const gCount = rand(1, 2);
  const guardians = Array.from({ length: gCount }).map(() => {
    const n = pickAdultName();
    return {
      id: uuidv4(),
      name: `${n.f} ${n.l}`,
      relation: pick(getGuardianRelations()),
      phone: makePhone(),
      email: makeEmail(n.f, n.l),
    };
  });
  const allergies = Math.random() < 0.6 ? pickManyUnique(getAllergyPool(), rand(0, 2)) : [];
  const healthNotes = Math.random() < 0.4 ? 'Düzenli kontrol önerildi.' : '';
  const interests = pickManyUnique(getInterestPool(), rand(2, 4));
  const strengths = pickManyUnique(getStrengthPool(), rand(1, 3));
  return {
    guardians,
    health: { allergies, notes: healthNotes },
    interests,
    strengths,
  };
};

// Demo görsel oluştur
const makeImageFile = async (text: string, bg = '#e0f2fe', fg = '#1e293b'): Promise<File> => {
  const canvas = document.createElement('canvas');
  const w = 640,
    h = 420;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#10b981';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(w - 80, 80, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = fg;
  ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(text, 32, 120);
  ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText('PortfoAI · Demo', 32, 160);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('blob failed'));
      resolve(new File([blob], 'demo.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
    }, 'image/jpeg', 0.9);
  });
};

// Demo verisi oluşturma fonksiyonu
export const seedDemoData = async (userId: string, opts: SeedOptions = {}) => {
  const log = (m: string) => {
    console.log('[seed]', m);
    opts.onProgress?.(m);
  };

  const classes =
    opts.classNames && opts.classNames.length > 0
      ? opts.classNames
      : Array.from({ length: opts.classes ?? 2 }, (_, i) => {
        const lang = getLanguage();
        if (lang === 'en') {
          return i === 0 ? 'Class A' : i === 1 ? 'Class B' : `Class ${i + 1}`;
        }
        return i === 0 ? 'Sınıf A' : i === 1 ? 'Sınıf B' : `Sınıf ${i + 1}`;
      });

  const perClass = opts.childrenPerClass ?? 15;
  const obsPerChild = opts.observationsPerChild ?? 7;
  const mediaPerChild = opts.mediaPerChild ?? 2;
  const record: SeedRecord = { time: new Date().toISOString(), classes: [], children: [], observations: [], media: [] };

  log(`Sınıflar: ${classes.join(', ')}`);

  // Sınıfları oluştur
  for (const name of classes) {
    try {
      const c = await createClass(userId, name);
      record.classes.push(c.id);
    } catch {
      /* ignore */
    }
  }

  // Her sınıf için çocuk oluştur
  for (const className of classes) {
    log(`${className} için ${perClass} çocuk oluşturuluyor...`);

    for (let i = 0; i < perClass; i++) {
      const first = pick(getFirstNames());
      const last = pick(getLastNames());
      const meta = makeChildMeta();

      const childPayload: Omit<Child, 'id' | 'user_id' | 'created_at'> = {
        first_name: first,
        last_name: last,
        dob: makeDob(),
        photo_url: undefined,
        classroom: className,
        consent_obtained: true,
        guardians: meta.guardians as any,
        health: meta.health as any,
        interests: meta.interests as any,
        strengths: meta.strengths as any,
      } as any;

      let child: Child;
      try {
        child = await addChild(childPayload, userId);
        record.children.push(child.id);

        // JSON alanlarının kalıcı olması için double-write
        try {
          await updateChild(child.id, {
            guardians: (childPayload as any).guardians,
            health: (childPayload as any).health,
            interests: (childPayload as any).interests,
            strengths: (childPayload as any).strengths,
          } as any);
        } catch (e) {
          console.warn('child meta update warn', e);
        }
      } catch (e) {
        console.error('Child insert failed', e);
        continue;
      }

      // Medya oluştur
      for (let m = 0; m < mediaPerChild; m++) {
        try {
          const file = await makeImageFile(`${first} ${last} · Ürün ${m + 1}`);
          const path = await uploadMedia(userId, child.id, file);
          const mediaRow = await addMediaRecord(
            {
              child_id: child.id,
              type: 'image',
              storage_path: path,
              name: `Ürün ${m + 1}`,
              description: 'Demo ürünü',
              domain: pick(domainList),
            },
            userId
          );
          record.media.push((mediaRow as any).id);
        } catch (e) {
          console.warn('Media upload skipped:', e);
        }
      }

      // Gözlemler oluştur
      for (let k = 0; k < obsPerChild; k++) {
        const dCount = rand(1, 3);
        const domains = pickManyUnique(domainList, dCount);
        const context = pick(contextList);

        // Risk dağılımı: %50 düşük, %35 orta, %15 yüksek
        const r = Math.random();
        const targetRisk: 'low' | 'medium' | 'high' = r < 0.5 ? 'low' : r < 0.85 ? 'medium' : 'high';

        const note = makeObservationNote(`${first} ${last}`, domains, context, targetRisk);
        const extraTagsPool = ['oyun', 'kitap', 'bahçe', 'müzik', 'sanat', 'ritim', 'paylaşım', 'ince-motor', 'kaba-motor'];
        const tagCount = rand(2, 3);
        const tags = ['demo', ...pickManyUnique(extraTagsPool, tagCount)];

        try {
          const created = await addObservation(
            {
              child_id: child.id,
              note,
              context,
              domains,
              tags,
            } as any,
            userId
          );

          if (created && (created as any).id) {
            record.observations.push((created as any).id);

            // Hızlı local AI assessment ekle
            try {
              const analysis = makeSeedAssessment(note, domains as DevelopmentDomain[]);
              await addAssessmentForObservation((created as any).id, userId, {
                summary: analysis.summary,
                risk: analysis.risk as any,
                suggestions: analysis.suggestions,
                domain_scores: analysis.domain_scores as any,
              });
            } catch (e) {
              console.warn('Seed assessment failed:', e);
            }
          }
        } catch (e) {
          console.warn('Observation insert skipped:', e);
        }
      }
    }
  }

  log('Demo verisi oluşturma tamamlandı.');
  try {
    localStorage.setItem('lastSeedRecord', JSON.stringify(record));
  } catch { }
};

// Demo verisini geri al (temizle)
export const removeDemoData = async (
  userId: string,
  opts: { aggressive?: boolean; days?: number; onProgress?: (m: string) => void } = {}
) => {
  const say = (m: string) => {
    console.log('[seed:revert]', m);
    opts.onProgress?.(m);
  };

  const recordRaw = (() => {
    try {
      return localStorage.getItem('lastSeedRecord');
    } catch {
      return null;
    }
  })();
  const record: SeedRecord | null = recordRaw ? JSON.parse(recordRaw) : null;

  // 1) Gözlemleri sil
  try {
    let obsIds: string[] = record?.observations || [];
    if (obsIds.length === 0) {
      const { data } = await supabase.from('observations').select('id').eq('user_id', userId).contains('tags', ['demo']);
      obsIds = (data || []).map((r: any) => r.id);
    }
    if (obsIds.length > 0) {
      say(`Gözlemler siliniyor (${obsIds.length})...`);
      await supabase.from('assessments').delete().in('observation_id', obsIds as any);
      await supabase.from('observations').delete().in('id', obsIds as any);
    }
  } catch (e) {
    console.warn('Obs revert warn:', e);
  }

  // 2) Medyaları sil
  try {
    let mediaIds: string[] = record?.media || [];
    if (mediaIds.length === 0) {
      const { data } = await supabase.from('media').select('id').eq('user_id', userId).eq('description', 'Demo ürünü');
      mediaIds = (data || []).map((r: any) => r.id);
    }
    if (mediaIds.length > 0) {
      say(`Medya siliniyor (${mediaIds.length})...`);
      const { data: toDel } = await supabase.from('media').select('id, storage_path').in('id', mediaIds as any);
      const paths = (toDel || []).map((r: any) => r.storage_path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from('child-media').remove(paths);
      }
      await supabase.from('media').delete().in('id', mediaIds as any);
    }
  } catch (e) {
    console.warn('Media revert warn:', e);
  }

  // 3) Çocukları sil
  try {
    let childIds: string[] = record?.children || [];
    if (childIds.length === 0) {
      const days = opts.days ?? 14;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase.from('children').select('id, created_at, classroom').eq('user_id', userId).gte('created_at', since.toISOString());
      const candidates = (data || []) as any[];
      if (candidates.length > 0) {
        const classSet = new Set(['Sınıf A', 'Sınıf B']);
        for (const c of candidates) {
          if (classSet.has(c.classroom)) childIds.push(c.id);
        }
      }
    }
    if (childIds.length > 0) {
      say(`Çocuklar siliniyor (${childIds.length})...`);
      for (const id of childIds) {
        try {
          await deleteChild(id);
        } catch (e) {
          console.warn('child delete warn', e);
        }
      }
    }
  } catch (e) {
    console.warn('Children revert warn:', e);
  }

  // 4) Sınıfları sil
  try {
    let classIds: string[] = record?.classes || [];
    if (classIds.length === 0) {
      const { data } = await supabase.from('classes').select('id, name').eq('user_id', userId);
      const list = (data || []) as any[];
      classIds = list.filter((r) => r.name === 'Sınıf A' || r.name === 'Sınıf B').map((r) => r.id);
    }
    if (classIds.length > 0) {
      say('Sınıflar siliniyor...');
      await supabase.from('classes').delete().in('id', classIds as any);
    }
  } catch (e) {
    console.warn('Classes revert warn:', e);
  }

  try {
    localStorage.removeItem('lastSeedRecord');
  } catch { }
  dispatchDataChangedEvent();
  say('Demo verisi geri alındı.');
};

