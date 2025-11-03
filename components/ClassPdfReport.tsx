// Class PDF report generator using HTML print approach.
// Produces a summary band, activity mini chart (last 7 days), AI summary/suggestions,
// and the children list for the class.

export type ActivityDay = { label: string; obs: number; media: number };

export async function exportClassReportPDF(args: {
  className: string;
  children: { id: string; first_name: string; last_name: string; classroom?: string }[];
  obs7d: number;
  media7d: number;
  activity: ActivityDay[];
  aiSummary?: string;
  aiSuggestions?: string[];
}): Promise<void> {
  const { className, children, obs7d, media7d, activity, aiSummary, aiSuggestions = [] } = args;

  const max = Math.max(1, ...activity.map((d) => d.obs + d.media));
  const bars = activity
    .map((d, i) => {
      const total = d.obs + d.media;
      const h = Math.round((total / max) * 88) + 8; // 8..96 px
      const x = i * 20 + 10; // bar spacing
      const y = 100 - h;
      return `<rect x="${x}" y="${y}" width="12" height="${h}" rx="3" fill="#3b82f6"></rect>`;
    })
    .join("");

  const labels = activity
    .map((d, i) => `<text x="${i * 20 + 16}" y="112" font-size="8" text-anchor="middle" fill="#64748b">${escapeHtml(d.label)}</text>`) 
    .join("");

  const html = `<!DOCTYPE html>
  <html lang="tr"><head><meta charset="utf-8" />
  <title>${escapeHtml(className)} - Sınıf Raporu</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;padding:16px}
    h1{margin:0 0 6px 0}
    .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#3b82f6;color:#fff;font-size:12px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .card{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin:10px 0}
    .muted{color:#64748b}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}
    .ul{margin:0;padding-left:18px}
  </style></head>
  <body>
    <h1>Sınıf Raporu <span class="badge">${escapeHtml(className)}</span></h1>
    <div class="muted">Oluşturma: ${new Date().toLocaleString('tr-TR')}</div>
    <div class="card">
      <div class="grid">
        <div><div class="muted">Çocuk</div><div style="font-size:22px;font-weight:700">${children.length}</div></div>
        <div><div class="muted">Son 7 Gün Gözlem</div><div style="font-size:22px;font-weight:700">${obs7d}</div></div>
        <div><div class="muted">Son 7 Gün Ürün</div><div style="font-size:22px;font-weight:700">${media7d}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="muted" style="margin-bottom:6px">Aktivite (7 gün)</div>
      <svg width="${activity.length * 20 + 20}" height="120" viewBox="0 0 ${activity.length * 20 + 20} 120">${bars}${labels}</svg>
    </div>
    ${aiSummary || aiSuggestions.length ? `<div class="card"><div style="font-weight:700;margin-bottom:6px">Sınıf için Yapay Zekâ Önerileri</div>${aiSummary ? `<p>${escapeHtml(aiSummary)}</p>` : ''}${aiSuggestions.length ? `<ul class="ul">${aiSuggestions.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}</div>` : ''}
    <div class="card">
      <div style="font-weight:700;margin-bottom:6px">Çocuklar</div>
      <table><thead><tr><th>Ad Soyad</th><th>Sınıf</th></tr></thead><tbody>
      ${children.map(c => `<tr><td>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</td><td>${escapeHtml(c.classroom||'')}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <script>window.addEventListener('load',()=>{setTimeout(()=>{window.print()},300)});</script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s?: string) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'} as any)[ch] || ch);
}

