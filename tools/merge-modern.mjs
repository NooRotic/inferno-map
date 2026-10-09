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
    seen.add(n.id);
    const pattern = n.k === 'pattern';
    nodes.push({ ...n, k: KINDS[n.k], modern: true, cite: (pattern ? n.term : n.when) || '', note: (pattern ? n.definition : n.summary) || '' });
    if (n.echoes) edges.push({ a: n.id, b: n.echoes, t: 'modern', cite: '', note: 'Echoes' });
  }
  const ends = new Set([...baseIds, ...seen, ...levelIds]);
  for (const e of modern.edges || []) {
    for (const end of [e.a, e.b]) if (!ends.has(end)) throw new Error(`modern edge end "${end}" is not a point or level`);
    edges.push(e);
  }
  const data = {
    ...base,
    meta: { ...base.meta, modernEdition: true, coverage: modern.coverage || null },
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
  return { data, sprites: out };
}
