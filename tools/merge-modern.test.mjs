import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeModern } from './merge-modern.mjs';

const base = () => ({ meta: { x: 1 }, levels: [{ id: 'lv1' }, { id: 'lv2' }], nodes: [{ id: 'b1', lv: 'lv1' }], edges: [{ a: 'b1', b: 'lv1', t: 'echo' }] });
const src = { id: 's1', type: 'court', title: 'T', publisher: 'P', date: '2000-01-01', url: 'https://example.test/a' };
const ev = (o = {}) => ({ id: 'm1', k: 'event', lv: 'lv2', a: 90, r: 0.5, unlocks: 5, echoes: 'b1', when: '1900', summary: 'Sum', sources: ['s1'], ...o });
const pat = (o = {}) => ({ id: 'p1', k: 'pattern', lv: 'lv2', a: 100, r: 0.4, unlocks: 6, echoes: 'lv1', term: 'Term', definition: 'Def', sources: ['s1'], ...o });
const run = (nodes, extra = {}) => mergeModern(base(), { nodes, sources: [src], ...extra });

test('merges an event: flags, cite from when, note from summary, echo edge', () => {
  const { data } = run([ev()]);
  const n = data.nodes.find((x) => x.id === 'm1');
  assert.equal(data.nodes.length, 2);
  assert.equal(n.k, 'mevent'); assert.equal(n.modern, true); assert.equal(n.cite, '1900'); assert.equal(n.note, 'Sum');
  assert.deepEqual(data.edges.at(-1), { a: 'm1', b: 'b1', t: 'modern', cite: '', note: 'Echoes' });
  assert.equal(data.meta.modernEdition, true); assert.equal(data.meta.x, 1);
  assert.equal(data.sources.s1.title, 'T');
});

test('merges a pattern: cite from term, note from definition', () => {
  const n = run([pat()]).data.nodes.at(-1);
  assert.equal(n.k, 'mpattern'); assert.equal(n.cite, 'Term'); assert.equal(n.note, 'Def');
});

test('echoes may name a level id', () => {
  assert.equal(run([pat()]).data.edges.at(-1).b, 'lv1');
});

test('does not mutate its inputs', () => {
  const b = base(), snap = JSON.stringify(b);
  mergeModern(b, { nodes: [ev()], sources: [src] });
  assert.equal(JSON.stringify(b), snap);
});

test('rejects bad nodes with a message naming the node', () => {
  assert.throws(() => run([ev({ lv: 'nope' })]), /modern node "m1": unknown level "nope"/);
  assert.throws(() => run([ev({ id: 'b1' })]), /duplicate id/);
  assert.throws(() => run([ev(), ev()]), /duplicate id/);
  assert.throws(() => run([ev({ echoes: 'zzz' })]), /echoes "zzz"/);
  assert.throws(() => run([ev({ sources: ['missing'] })]), /unknown source "missing"/);
  assert.throws(() => run([ev({ k: 'soul' })]), /k must be/);
  assert.throws(() => run([ev({ unlocks: 0 })]), /unlocks/);
  assert.throws(() => run([ev({ unlocks: 36 })]), /unlocks/);
});

test('rejects a non-http source url (javascript:, data:)', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//example.test', 'ftp://example.test']) {
    assert.throws(() => mergeModern(base(), { nodes: [], sources: [{ ...src, url }] }), /url must start with http/);
  }
});

test('rejects duplicate source ids', () => {
  assert.throws(() => mergeModern(base(), { nodes: [], sources: [src, src] }), /duplicate source id/);
});

test('sprites: merges, tolerates identical duplicates, rejects conflicts, merges kindDefaults', () => {
  const bs = { palette: { k: '#000' }, sprites: { a: { grid: ['x'] } }, kindDefaults: { soul: 'a' } };
  const ok = mergeModern(base(), { nodes: [] }, bs, { palette: { k: '#000', z: '#123456' }, sprites: { b: { grid: ['y'] } }, kindDefaults: { mevent: 'b' } });
  assert.deepEqual(Object.keys(ok.sprites.sprites), ['a', 'b']);
  assert.equal(ok.sprites.palette.z, '#123456');
  assert.deepEqual(ok.sprites.kindDefaults, { soul: 'a', mevent: 'b' });
  assert.throws(() => mergeModern(base(), { nodes: [] }, bs, { sprites: { a: { grid: ['different'] } } }), /sprites "a" conflicts/);
  assert.throws(() => mergeModern(base(), { nodes: [] }, bs, { palette: { k: '#fff' } }), /palette "k" conflicts/);
});

test('coverage passes through, null when absent; extra edges are validated', () => {
  assert.equal(run([ev()]).data.meta.coverage, null);
  assert.deepEqual(run([ev()], { coverage: { items: [] } }).data.meta.coverage, { items: [] });
  assert.throws(() => run([ev()], { edges: [{ a: 'm1', b: 'ghost', t: 'modern' }] }), /edge end "ghost"/);
  assert.equal(run([ev()], { edges: [{ a: 'm1', b: 'lv1', t: 'modern', cite: '', note: 'x' }] }).data.edges.length, 3);
});
