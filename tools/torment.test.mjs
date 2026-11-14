import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, span, norm, quoteProblems, countMismatches, loadCached, LINE_COUNTS } from './longfellow.mjs';

const data = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'inferno.json'), 'utf8'));
const has = (n, f) => typeof n[f] === 'string' && n[f].trim().length > 0;

test('every soul says what its torment is and why it fits', () => {
  const missing = data.nodes.filter((n) => n.k === 'soul' && !(has(n, 'torment') && has(n, 'contrapasso')));
  assert.deepEqual(missing.map((n) => n.id), []);
});

test('torment and contrapasso come as a pair, and contrapasso carries its own conf', () => {
  for (const n of data.nodes) {
    assert.equal(has(n, 'torment'), has(n, 'contrapasso'), `${n.id}: torment and contrapasso must both be set or both absent`);
    if (has(n, 'contrapasso')) assert.ok(['text', 'interp'].includes(n.cpconf), `${n.id}: cpconf must be text or interp`);
    else assert.equal(n.cpconf, undefined, `${n.id}: cpconf without a contrapasso`);
  }
});

test('quotes in the new fields use curly marks, so the Longfellow check can see them', () => {
  for (const n of data.nodes) for (const f of ['torment', 'contrapasso']) {
    if (!has(n, f)) continue;
    assert.ok(!n[f].includes('"'), `${n.id}.${f}: straight double quote`);
    assert.equal((n[f].match(/“/g) || []).length, (n[f].match(/”/g) || []).length, `${n.id}.${f}: unbalanced quote marks`);
  }
});

// The parser and citation spans, on a two-canto stand-in so this runs without the real text.
const FAKE = 'header\nInferno: Canto I\n\nOne line\nTwo, line\n\nInferno: Canto II\nThree ’tis\nFour\n*** END OF THE BOOK\nlicence';

test('parse numbers non-blank lines per canto and stops at the licence', () => {
  assert.deepEqual(parse(FAKE), { I: ['One line', 'Two, line'], II: ['Three ’tis', 'Four'] });
});

test('span joins a citation across lines and cantos; norm ignores punctuation and apostrophe style', () => {
  const c = parse(FAKE);
  assert.equal(span(c, 'I.2'), 'two line');
  assert.equal(span(c, 'I.2–II.1'), "two line three 'tis");
  assert.equal(span(c, 'nonsense'), null);
  assert.ok(span(c, 'I.1-2').includes(norm('line. Two')));
});

test('quoteProblems flags a quote that is not in the text', () => {
  const c = parse(FAKE);
  const d = { nodes: [{ id: 'x', cite: 'I.1-2', en: 'One line', note: 'He said “two line” and “five line”.' }] };
  assert.deepEqual(quoteProblems(d, c), ['x.note: “five line” is not Longfellow']);
});

const cantos = loadCached();
const skip = cantos ? false : 'no Longfellow text yet: run node tools/longfellow.mjs fetch';

test('the cached Longfellow text has the Italian line count in every canto', { skip }, () => {
  assert.equal(Object.keys(cantos).length, LINE_COUNTS.length);
  assert.deepEqual(countMismatches(cantos), []);
});

test('every English quote in inferno.json is Longfellow, and every en line sits in its citation', { skip }, () => {
  assert.deepEqual(quoteProblems(data, cantos), []);
});
