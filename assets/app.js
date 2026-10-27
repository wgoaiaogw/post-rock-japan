// POSTROCK JAPAN - shared logic
const DB = { events: [], artists: [], venues: [] };

async function loadDB() {
  const [e, a, v] = await Promise.all([
    fetch('data/events.json').then(r => r.json()),
    fetch('data/artists.json').then(r => r.json()),
    fetch('data/venues.json').then(r => r.json())
  ]);
  DB.events = e; DB.artists = a; DB.venues = v;
}
const artistById = id => DB.artists.find(a => a.id === id);
const venueById = id => DB.venues.find(v => v.id === id);
const yen = n => (n == null ? '—' : '¥' + Number(n).toLocaleString('ja-JP'));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function isPast(ev) { const t = new Date(); t.setHours(0,0,0,0); return new Date(ev.date + 'T00:00:00') < t; }
function badgeClass(status) {
  if (!status) return 'pre';
  if (/終了|完売|終了/.test(status)) return 'end';
  if (/発売中|受付中|販売中/.test(status)) return '';
  return 'pre';
}
function artistLinks(ev) {
  return (ev.artist_ids || []).map(id => {
    const a = artistById(id);
    return a ? `<a href="artist.html?id=${encodeURIComponent(id)}">${esc(a.name)}</a>` : '';
  }).filter(Boolean).join(' / ');
}
function eventCard(ev) {
  const v = venueById(ev.venue_id);
  const d = new Date(ev.date + 'T00:00:00');
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `<article class="ev">
    <div class="date"><div class="d">${d.getDate()}</div><div class="w">${d.getMonth() + 1}月・${wd}</div></div>
    <div class="body">
      <div class="title"><a href="event.html?id=${encodeURIComponent(ev.id)}">${esc(ev.title)}</a>
      ${isPast(ev) ? '<span class="badge end">終了</span>' : (ev.ticket_status ? `<span class="badge ${badgeClass(ev.ticket_status)}">${esc(ev.ticket_status)}</span>` : '')}</div>
      <div class="meta">${artistLinks(ev)}</div>
      <div class="meta">${v ? `<a href="venue.html?id=${encodeURIComponent(v.id)}">${esc(v.name)}</a>（${esc(v.area)}）` : ''}</div>
      <div class="price">OPEN ${esc(ev.open || '—')} / START ${esc(ev.start || '—')}　前売 ${yen(ev.price_adv)}${ev.price_door != null ? ` / 当日 ${yen(ev.price_door)}` : ''}</div>
    </div></article>`;
}
function pastEvents(filterFn) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return DB.events
    .filter(ev => new Date(ev.date + 'T00:00:00') < today)
    .filter(filterFn || (() => true))
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.start || '').localeCompare(String(a.start || '')));
}
function upcomingEvents(filterFn) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return DB.events
    .filter(ev => new Date(ev.date + 'T00:00:00') >= today)
    .filter(filterFn || (() => true))
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.start || '').localeCompare(String(b.start || '')));
}
function renderEventList(el, list) {
  if (!list.length) { el.innerHTML = '<p class="empty">該当する公演がありません。</p>'; return; }
  let html = '', lastMonth = '';
  for (const ev of list) {
    const m = ev.date.slice(0, 7);
    if (m !== lastMonth) { html += `<div class="month-head">${m.replace('-', '年')}月</div>`; lastMonth = m; }
    html += eventCard(ev);
  }
  el.innerHTML = html;
}
const qs = new URLSearchParams(location.search);
