import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';

// Types (exactly as requested)
export type Risk = 'low' | 'medium' | 'high';
export type Child = {
  firstName: string; lastName: string; dob: string; classroom?: string; photoUrl?: string;
};
export type Observation = { id: string; createdAt: string; note: string; };
export type Assessment = {
  observationId: string; summary: string;
  suggestions: string[]; risk: Risk;
};

// Helpers (local only)
function escapeHtml(v: string | null | undefined): string {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTimeTR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function calcAge(dobIso: string): string {
  const b = new Date(dobIso);
  const t = new Date();
  let y = t.getFullYear() - b.getFullYear();
  let m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) { y -= 1; m += 12; }
  return `${y} yıl, ${m} ay`;
}

function riskTR(r: Risk): string { return r === 'low' ? 'Düşük' : r === 'medium' ? 'Orta' : 'Yüksek'; }
function riskClass(r: Risk): string { return r === 'low' ? 'risk-low' : r === 'medium' ? 'risk-medium' : 'risk-high'; }
function monogram(first: string, last: string): string {
  const a = (first?.trim()?.[0] ?? '').toLocaleUpperCase('tr-TR');
  const b = (last?.trim()?.[0] ?? '').toLocaleUpperCase('tr-TR');
  return escapeHtml(`${a}${b}`);
}

function buildHtml(args: {
  child: Child;
  observations: Observation[];
  assessments: Assessment[];
  teacherName?: string;
  schoolName?: string;
  reportDate?: string;
}) {
  const { child, assessments, teacherName, schoolName } = args;
  const reportDate = args.reportDate ?? new Date().toISOString();

  const observations = [...args.observations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const byObs = new Map<string, Assessment>();
  for (const a of assessments) byObs.set(a.observationId, a);

  const head = [
    teacherName ? `Öğretmen: ${escapeHtml(teacherName)}` : null,
    schoolName ? `Okul: ${escapeHtml(schoolName)}` : null,
    `Rapor: ${formatDateTR(reportDate)}`
  ].filter(Boolean).join(' | ');

  const avatar = child.photoUrl
    ? `<img class="avatar-img" src="${escapeHtml(child.photoUrl)}" alt="Fotoğraf" />`
    : `<div class="avatar-fallback">${monogram(child.firstName, child.lastName)}</div>`;

  const childCard = `
    <section class="card child-card">
      <div class="child-row">
        <div class="avatar">${avatar}</div>
        <div class="child-info">
          <div class="child-name">${escapeHtml(child.firstName)} ${escapeHtml(child.lastName)}</div>
          <div class="child-line"><span class="label">Doğum:</span> ${child.dob ? formatDateTR(child.dob) : '—'} <span class="muted">(Yaş: ${child.dob ? calcAge(child.dob) : '—'})</span></div>
          <div class="child-line"><span class="label">Sınıf:</span> ${child.classroom ? escapeHtml(child.classroom) : '—'}</div>
        </div>
      </div>
    </section>`;

  const blocks = observations.map((o) => {
    const a = byObs.get(o.id);
    const risk = a ? `<span class="badge ${riskClass(a.risk)}">${riskTR(a.risk)}</span>` : `<span class="badge risk-muted">—</span>`;
    const summary = a?.summary ? `<p>${escapeHtml(a.summary)}</p>` : '—';
    const sugg = a && a.suggestions?.length
      ? `<ul class="ul">${a.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      : '<div class="muted">—</div>';

    return `
      <section class="card obs-card">
        <div class="obs-head">
          <div class="head-left">
            <div class="head-title">Gözlem Tarihi</div>
            <div class="head-date">${formatDateTimeTR(o.createdAt)}</div>
          </div>
          <div class="head-right">${risk}</div>
        </div>

        <div class="field">
          <div class="field-title">Gözlem Notu</div>
          <div class="field-body">${o.note ? escapeHtml(o.note) : '—'}</div>
        </div>

        <div class="field">
          <div class="field-title">Yapay Zekâ Özeti</div>
          <div class="field-body">${summary}</div>
        </div>

        <div class="field">
          <div class="field-title">Öğretmene Öneriler</div>
          <div class="field-body">${sugg}</div>
        </div>
      </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Beceri Edinim Raporu</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    :root{
      --text:#111827; --muted:#6b7280; --border:#e5e7eb; --bg:#fff;
      --primary:#3b82f6; --card:#fff;
      --risk-low:#10b981; --risk-medium:#f59e0b; --risk-high:#ef4444; --risk-muted:#9ca3af;
    }
    *{ box-sizing:border-box; }
    body{
      font-family:"Inter","Segoe UI",Roboto,Arial,Helvetica,sans-serif;
      color:var(--text); margin:0; background:var(--bg);
      -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
      hyphens:none; word-break:break-word; white-space:pre-wrap;
    }
    .header{ background:var(--primary); color:#fff; padding:16px 20px; border-radius:8px; margin-bottom:14px; }
    .title{ font-size:20px; margin:0 0 6px 0; font-weight:700; letter-spacing:0; }
    .subtitle{ margin:0; font-size:12px; opacity:.95; }

    .card{ background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px; line-height:1.5; margin:10px 0; }
    .child-card{ padding:16px; }
    .child-row{ display:flex; gap:14px; align-items:center; }
    .avatar{ width:72px; height:72px; flex:0 0 72px; }
    .avatar-img{ width:72px; height:72px; border-radius:50%; object-fit:cover; border:1px solid var(--border); }
    .avatar-fallback{ width:72px; height:72px; border-radius:50%; background:#e5e7eb; color:#6b7280; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; border:1px solid var(--border); }
    .child-info{ flex:1; }
    .child-name{ font-size:18px; font-weight:700; margin-bottom:4px; }
    .child-line{ font-size:12px; }
    .label{ color:var(--muted); margin-right:6px; }
    .muted{ color:var(--muted); }

    .obs-card{ page-break-inside: avoid; }
    .obs-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
    .head-left{ display:flex; flex-direction:column; }
    .head-title{ font-weight:700; font-size:13px; }
    .head-date{ font-size:12px; color:var(--muted); }
    .head-right{ display:flex; align-items:center; gap:6px; }

    .field{ margin-top:10px; }
    .field-title{ font-weight:700; font-size:13px; margin-bottom:4px; }
    .field-body{ font-size:12px; }

    .badge{ display:inline-block; color:#fff; padding:4px 10px; border-radius:999px; font-size:11px; line-height:1; }
    .risk-low{ background:var(--risk-low); }
    .risk-medium{ background:var(--risk-medium); }
    .risk-high{ background:var(--risk-high); }
    .risk-muted{ background:var(--risk-muted); }

    .ul{ margin:0; padding-left:18px; }
    .ul li{ margin:3px 0; }
  </style>
</head>
<body>
  <main>
    <header class="header">
      <h1 class="title">Beceri Edinim Raporu</h1>
      <p class="subtitle">${escapeHtml(head)}</p>
    </header>

    ${childCard}

    ${blocks || `<section class="card"><div class="muted">Gözlem bulunamadı.</div></section>`}
  </main>
</body>
</html>`;
}

// Public API
export async function exportChildReportPDF(args: {
  child: Child;
  observations: Observation[];      // newest first (sorted inside)
  assessments: Assessment[];        // match by observationId
  teacherName?: string;
  schoolName?: string;
  reportDate?: string;              // ISO; defaults to now
  share?: boolean;                  // default true
}): Promise<{ uri: string }> {
  const { child, observations, assessments, teacherName, schoolName, reportDate, share = true } = args;

  const html = buildHtml({ child, observations, assessments, teacherName, schoolName, reportDate });

  const { uri } = await printToFileAsync({ html });

  if (share) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch {
      // sharing is optional
    }
  }

  return { uri };
}

