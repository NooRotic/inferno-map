// Merge a modern-edition data folder over the book edition.
// Content-free: this file knows the SHAPE of the data, never any of it.
const KINDS = { event: 'mevent', pattern: 'mpattern' };
const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export function mergeModern(base, modern, baseSprites = {}, modernSprites = {}) {
  const levelIds = new Set(base.levels.map((l) => l.id));
  const baseIds = new Set(base.nodes.map((n) => n.id));
  const seen = new Set();
  const sources = {};
  for (const s of modern.sources || []) {
    if (!s.id) throw new Error('source without an id');
    if (sources[s.id]) throw new Error(`duplicate source id "${s.id}"`);
    if (!isHttp(s.url)) throw new Error(`source "${s.id}": url must start with http:// or https://`);
    sources[s.id] = s;
  }
  const nodes = [], edges = [];
  for (const n of modern.nodes || []) {
    if (!n.id) throw new Error('modern node without an id');
    const at = `modern node "${n.id}"`;
    if (!KINDS[n.k]) throw new Error(`${at}: k must be "event" or "pattern"`);
    if (!levelIds.has(n.lv)) throw new Error(`${at}: unknown level "${n.lv}"`);
    if (baseIds.has(n.id) || seen.has(n.id)) throw new Error(`${at}: duplicate id`);
    if (!(n.unlocks >= 1 && n.unlocks <= 35)) throw new Error(`${at}: unlocks must be a canto from 1 to 35`);
    for (const sid of n.sources || []) if (!sources[sid]) throw new Error(`${at}: unknown source "${sid}"`);
    if (n.echoes && !baseIds.has(n.echoes) && !levelIds.has(n.echoes)) throw new Error(`${at}: echoes "${n.echoes}" is not a book point or level`);
    const also = [];
    if (n.also != null) {
      if (!Array.isArray(n.also)) throw new Error(`${at}: also must be a list of book point ids or { to, note }`);
      for (const x of n.also) {
        const to = typeof x === 'string' ? x : x && x.to, note = typeof x === 'string' ? 'Echoes' : x && x.note;
        if (typeof to !== 'string') throw new Error(`${at}: each also entry needs a "to" id`);
        if (!baseIds.has(to) && !levelIds.has(to)) throw new Error(`${at}: also "${to}" is not a book point or level`);
        if (to === n.echoes || also.some((y) => y.to === to)) throw new Error(`${at}: also "${to}" is already linked`);
        if (typeof note !== 'string' || !note.trim()) throw new Error(`${at}: also "${to}" needs a non-empty note`);
        also.push({ to, note });
      }
    }
    if (n.flag != null && !(modern.flags && Object.prototype.hasOwnProperty.call(modern.flags, n.flag))) throw new Error(`${at}: flag "${n.flag}" is not in the flag set`);
    seen.add(n.id);
    const pattern = n.k === 'pattern';
    nodes.push({ ...n, k: KINDS[n.k], modern: true, cite: (pattern ? n.term : n.when) || '', note: (pattern ? n.definition : n.summary) || '' });
    if (n.echoes) edges.push({ a: n.id, b: n.echoes, t: 'modern', cite: '', note: 'Echoes' });
    for (const x of also) edges.push({ a: n.id, b: x.to, t: 'modern', cite: '', note: x.note });
  }
  const ends = new Set([...baseIds, ...seen, ...levelIds]);
  for (const e of modern.edges || []) {
    for (const end of [e.a, e.b]) if (!ends.has(end)) throw new Error(`modern edge end "${end}" is not a point or level`);
    edges.push(e);
  }
  if (modern.flags != null) checkFlags(modern.flags);
  const data = {
    ...base,
    meta: { ...base.meta, modernEdition: true, coverage: modern.coverage || null, legend: modern.legend || null, flags: modern.flags || null },
    nodes: [...base.nodes, ...nodes],
    edges: [...(base.edges || []), ...edges],
    sources,
  };
  const out = { ...baseSprites };
  for (const part of ['palette', 'mods', 'templates', 'sprites']) {
    out[part] = { ...(baseSprites[part] || {}) };
    for (const [k, v] of Object.entries(modernSprites[part] || {})) {
      if (k in out[part] && JSON.stringify(out[part][k]) !== JSON.stringify(v)) throw new Error(`modern ${part} "${k}" conflicts with the book edition`);
      out[part][k] = v;
    }
  }
  out.kindDefaults = { ...(baseSprites.kindDefaults || {}), ...(modernSprites.kindDefaults || {}) };
  if (modern.legend != null) {
    if (!Array.isArray(modern.legend)) throw new Error('legend must be a list of { icon, label }');
    modern.legend.forEach((e, i) => {
      const at = `legend entry ${i + 1}`;
      if (!e || !(e.icon in out.sprites)) throw new Error(`${at}: unknown icon "${e && e.icon}"`);
      if (typeof e.label !== 'string' || !e.label.trim()) throw new Error(`${at}: label must be a non-empty string`);
    });
  }
  return { data, sprites: out };
}

/* a flag is a few flat shapes on a 24 x 16 canvas: rect {t:'r',x,y,w,h,f}, polygon {t:'p',pts,f}, circle {t:'c',cx,cy,r,f}, line {t:'l',x1,y1,x2,y2,w,f}; f is a #rrggbb colour */
const NUM = { r: ['x', 'y', 'w', 'h'], c: ['cx', 'cy', 'r'], l: ['x1', 'y1', 'x2', 'y2', 'w'] };
function checkFlags(flags) {
  if (typeof flags !== 'object' || Array.isArray(flags)) throw new Error('flags must be an object keyed by country code');
  for (const [cc, spec] of Object.entries(flags)) {
    const at = `flag "${cc}"`;
    if (!/^[A-Z]{2}$/.test(cc)) throw new Error(`${at}: the key must be two capital letters`);
    if (!spec || !Array.isArray(spec.shapes) || !spec.shapes.length) throw new Error(`${at}: needs a non-empty shapes list`);
    spec.shapes.forEach((s, i) => {
      const w = `${at} shape ${i + 1}`;
      if (!s || !(s.t === 'p' || s.t in NUM)) throw new Error(`${w}: unknown shape type`);
      if (!/^#[0-9a-fA-F]{6}$/.test(s.f || '')) throw new Error(`${w}: f must be a #rrggbb colour`);
      if (s.t === 'p') { if (!Array.isArray(s.pts) || s.pts.length < 3 || !s.pts.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) throw new Error(`${w}: pts must be 3 or more [x, y] number pairs`); }
      else for (const k of NUM[s.t]) if (!Number.isFinite(s[k])) throw new Error(`${w}: ${k} must be a number`);
    });
  }
}
