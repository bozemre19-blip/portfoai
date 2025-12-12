import type { Child, Observation, Assessment, Media } from '../types';
import { t, getLanguage, getDateLocale } from '../constants.clean';

export type Risk = 'low' | 'medium' | 'high';
type ObsWithAssess = Observation & { assessments: Assessment | null };
type MediaWithUrl = Media & { url?: string };

function escapeHtml(s?: string | null) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(v?: string) {
  const locale = getDateLocale();
  try { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(v!)); }
  catch { return '—'; }
}
function fmtDateTime(v?: string) {
  const locale = getDateLocale();
  try { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v!)); }
  catch { return '—'; }
}
function calcAge(dobIso?: string) {
  if (!dobIso) return '—';
  const b = new Date(dobIso); const now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  let m = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) m--;
  if (m < 0) { y--; m += 12; }
  return `${y} ${t('pdfYears')}, ${m} ${t('pdfMonths')}`;
}

function riskBadge(r?: Risk) {
  if (!r) return `<span class="badge muted">—</span>`;
  const label = r === 'low' ? t('priorityLow').replace(/🟢\s*/, '') : r === 'medium' ? t('priorityMedium').replace(/🟡\s*/, '') : t('priorityHigh').replace(/🔴\s*/, '');
  return `<span class="badge ${r}">${label}</span>`;
}

function buildHtml(opts: {
  child: Child | any;
  observations: ObsWithAssess[];
  media?: MediaWithUrl[];
  teacherName?: string;
  schoolName?: string;
}) {
  const { child, observations, media = [], teacherName, schoolName } = opts;
  const lang = getLanguage();

  const first = (child as any).first_name ?? (child as any).firstName ?? '';
  const last = (child as any).last_name ?? (child as any).lastName ?? '';
  const dob = (child as any).dob as string | undefined;
  const classRoom = (child as any).classroom ?? (child as any).classRoom ?? '';
  const photo = (child as any).photo_url ?? (child as any).photoUrl;

  const headerRight = [
    teacherName ? `${t('pdfTeacher')}: ${escapeHtml(teacherName)}` : null,
    schoolName ? `${t('pdfSchool')}: ${escapeHtml(schoolName)}` : null,
    `${t('pdfReport')}: ${fmtDate(new Date().toISOString())}`
  ].filter(Boolean).join('  •  ');

  const avatar = photo
    ? `<img class="avatar-img" src="${escapeHtml(photo)}" alt="Photo"/>`
    : `<div class="avatar-fallback">${escapeHtml((first?.[0] || '').toUpperCase() + (last?.[0] || '').toUpperCase())}</div>`;

  const mediaSection = media.length
    ? `<section class="card">
        <h2 class="sec-title">${t('pdfProductMedia')}</h2>
        <div class="media-grid">
          ${media.map(m => (m as any)?.url ? `
            <figure class="media-item">
              <img src="${escapeHtml((m as any).url)}" alt="media"/>
              ${(m as any)['name'] ? `<figcaption>${escapeHtml(String((m as any)['name']))}</figcaption>` : ''}
            </figure>
          ` : '').join('')}
        </div>
      </section>` : '';

  const obsBlocks = (observations || []).map(o => {
    const a = o.assessments;
    const note = (o as any).note ?? '';
    const created = (o as any).created_at ?? o.createdAt;

    const sugg = a?.suggestions?.length
      ? `<ul class="ul">${a.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      : `<div class="muted">—</div>`;

    const summary = a?.summary ? `<p>${escapeHtml(a.summary)}</p>` : `<div class="muted">—</div>`;

    return `
      <section class="card obs-card">
        <div class="obs-head">
          <div class="obs-title">${t('pdfObservation')}</div>
          <div class="obs-meta">
            <span class="obs-date">${fmtDateTime(created)}</span>
            ${riskBadge(a?.risk as Risk)}
          </div>
        </div>

        <div class="field">
          <div class="field-title">${t('pdfObservationNote')}</div>
          <div class="field-body">${escapeHtml(note) || '—'}</div>
        </div>

        <div class="split">
          <div class="split-col">
            <div class="field">
              <div class="field-title">${t('pdfAiSummary')}</div>
              <div class="field-body">${summary}</div>
            </div>
          </div>
          <div class="split-col">
            <div class="field">
              <div class="field-title">${t('pdfSuggestions')}</div>
              <div class="field-body">${sugg}</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${t('pdfTitle')}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    :root{
      --text:#0f172a; --muted:#64748b; --border:#e2e8f0; --bg:#ffffff;
      --primary:#2563eb; --chip:#eff6ff; --chipText:#1d4ed8;
      --low:#10b981; --med:#f59e0b; --high:#ef4444;
    }
    html,body{ padding:0; margin:0; background:#fff; }
    body{
      font-family: "Inter","Segoe UI", Roboto, Arial, Helvetica, sans-serif;
      color:var(--text); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
      line-height:1.5;
    }
    .header{ background:linear-gradient(90deg, var(--primary), #3b82f6); color:#fff; padding:14px 18px; border-radius:10px; margin-bottom:14px; }
    .title{ margin:0; font-size:20px; font-weight:800; letter-spacing:.2px; }
    .subtitle{ margin:4px 0 0 0; font-size:12px; opacity:.95; }

    .card{ background:#fff; border:1px solid var(--border); border-radius:12px; padding:14px 16px; margin:12px 0; }
    .sec-title{ font-size:14px; font-weight:700; margin:0 0 8px 0; }

    .child{ display:flex; gap:14px; align-items:center; }
    .avatar-img,.avatar-fallback{ width:72px;height:72px;border-radius:50%;border:1px solid var(--border);object-fit:cover; display:flex;align-items:center;justify-content:center; }
    .avatar-fallback{ background:#e2e8f0; color:#475569; font-weight:800; font-size:22px; }
    .child-name{ font-size:18px; font-weight:800; margin:0 0 4px 0; }
    .meta{ display:grid; grid-template-columns:auto 1fr; gap:4px 8px; font-size:12px; }
    .label{ color:var(--muted); }
    .chip{ display:inline-block; background:var(--chip); color:var(--chipText); border:1px solid #dbeafe; border-radius:999px; padding:2px 8px; font-size:11px; font-weight:600; }

    .obs-card{ page-break-inside: avoid; }
    .obs-head{ display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:8px; }
    .obs-title{ font-weight:800; font-size:13px; }
    .obs-meta{ display:flex; gap:8px; align-items:center; }
    .obs-date{ font-size:12px; color:var(--muted); }

    .field{ margin-top:8px; }
    .field-title{ font-size:12px; font-weight:700; margin-bottom:2px; color:#0b1220; }
    .field-body{ font-size:12px; }

    .split{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .split-col{ min-width:0; }

    .ul{ margin:0; padding-left:18px; font-size:12px; }
    .ul li{ margin:2px 0; }

    .badge{ display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; color:#fff; font-weight:700; }
    .badge.low{ background:var(--low); }
    .badge.medium{ background:var(--med); }
    .badge.high{ background:var(--high); }
    .badge.muted{ background:#94a3b8; }

    .media-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .media-item img{ width:100%; height:auto; border:1px solid var(--border); border-radius:8px; }
    .media-item figcaption{ font-size:11px; color:var(--muted); margin-top:3px; }

    @media print { .header{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <header class="header">
    <h1 class="title">${t('pdfTitle')}</h1>
    <p class="subtitle">${headerRight}</p>
  </header>

  <section class="card">
    <div class="child">
      ${avatar}
      <div>
        <div class="child-name">${escapeHtml(first)} ${escapeHtml(last)}</div>
        <div class="meta">
          <div class="label">${t('pdfBirth')}:</div><div>${dob ? fmtDate(dob) : '—'} <span class="chip">${t('pdfAge')}: ${calcAge(dob)}</span></div>
          <div class="label">${t('pdfClass')}:</div><div>${classRoom ? escapeHtml(classRoom) : '—'}</div>
        </div>
      </div>
    </div>
  </section>

  ${obsBlocks || `<section class="card"><div class="field-body muted">${t('pdfNoObservations')}</div></section>`}

  ${mediaSection}

  <script>
    window.addEventListener('load', () => { setTimeout(() => { try { window.print(); } catch(e){} }, 300); });
    window.addEventListener('afterprint', () => { try { window.close(); } catch(e){} });
  </script>
</body>
</html>`;
}

export const generatePdf = async (
  child: any,
  observations: ObsWithAssess[],
  media: MediaWithUrl[] = [],
  teacherName?: string,
  schoolName?: string
) => {
  const html = buildHtml({ child, observations, media, teacherName, schoolName });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
};
