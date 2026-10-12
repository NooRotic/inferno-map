import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The journey logic lives inside src/index.html between two marker comments, so the page stays one
// self-contained file. This test pulls the block out and runs it in isolation.
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.html'), 'utf8');
const m = /\/\* journey:begin \*\/([\s\S]*?)\/\* journey:end \*\//.exec(html);
const J = m ? new Function(`${m[1]}; return { JOURNEY, planStops, journeyReset, journeyStep, holdFor, captionText };`)() : null;

test('the journey block exists in index.html', () => assert.ok(m, 'missing journey:begin / journey:end markers'));

const stops = () => J.planStops([{ id: 'a', c: 5.2, len: 80 }, { id: 'b', c: 5.21, len: 80 }, { id: 'c', c: 9, len: 80 }, { id: 'd', c: 2, len: 80 }]);

test('planStops sorts by canto and keeps a minimum gap by nudging, never dropping', () => {
  const s = stops();
  assert.deepEqual(s.map((x) => x.id), ['d', 'a', 'b', 'c']);
  for (let i = 1; i < s.length; i++) assert.ok(s[i].c - s[i - 1].c >= J.JOURNEY.MIN_GAP - 1e-9, `gap ${i}`);
  assert.equal(s.length, 4);
});

test('planStops keeps every stop inside the journey (before the last canto)', () => {
  const s = J.planStops([{ id: 'z', c: 34.99, len: 50 }, { id: 'y', c: 35, len: 50 }]);
  s.forEach((x) => assert.ok(x.c <= J.JOURNEY.LAST_CANTO));
});

test('holdFor grows with caption length and stays within bounds', () => {
  assert.equal(J.holdFor(0), J.JOURNEY.HOLD_MIN);
  assert.equal(J.holdFor(10000), J.JOURNEY.HOLD_MAX);
  assert.ok(J.holdFor(200) > J.holdFor(60));
});

test('far from a stop the journey runs at full rate with no caption', () => {
  const st = stops(), s = J.journeyReset(st, 1);
  const r = J.journeyStep(s, 0.016, 1, st);
  assert.equal(r.rate, 1); assert.equal(r.alpha, 0); assert.equal(r.stop, null);
});

test('approaching a stop slows the journey smoothly but never to a standstill', () => {
  const st = stops(), s = J.journeyReset(st, 1);
  const far = J.journeyStep(s, 0.016, 2 - J.JOURNEY.APPROACH - 0.01, st).rate;
  const mid = J.journeyStep(s, 0.016, 2 - J.JOURNEY.APPROACH / 2, st).rate;
  const near = J.journeyStep(s, 0.016, 2 - 0.02, st).rate;
  assert.equal(far, 1);
  assert.ok(mid < 1 && mid > near, `mid ${mid} near ${near}`);
  assert.ok(near >= J.JOURNEY.MIN_RATE && near < 0.5);
});

test('reaching a stop holds still, fades the caption in over time, then resumes and consumes it', () => {
  const st = stops(), s = J.journeyReset(st, 1);
  let r = J.journeyStep(s, 0.016, 2, st);
  assert.equal(r.rate, 0); assert.equal(r.stop.id, 'd'); assert.equal(s.phase, 'hold');
  const a0 = r.alpha; r = J.journeyStep(s, 0.3, 2, st); assert.ok(r.alpha > a0 && r.alpha < 1, `alpha ${r.alpha}`);
  r = J.journeyStep(s, 1.5, 2, st); assert.equal(r.alpha, 1); assert.equal(r.rate, 0);
  r = J.journeyStep(s, st[0].hold, 2, st);                       // the hold runs out
  assert.equal(s.phase, 'resume'); assert.ok(r.rate > 0 && r.rate < 1, `resume rate ${r.rate}`);
  for (let i = 0; i < 400; i++) r = J.journeyStep(s, 0.016, 2.5, st);
  assert.equal(s.phase, 'travel'); assert.equal(r.rate, 1); assert.equal(r.alpha, 0); assert.equal(s.i, 1);
});

test('the caption fades out while the journey resumes', () => {
  const st = stops(), s = J.journeyReset(st, 1);
  J.journeyStep(s, 0.016, 2, st); J.journeyStep(s, 3, 2, st); J.journeyStep(s, st[0].hold, 2, st);
  const r = J.journeyStep(s, 0.2, 2.1, st);
  assert.ok(r.alpha < 1 && r.alpha >= 0);
});

test('a stop right after the previous one still slows the journey during resume', () => {
  const st = J.planStops([{ id: 'p', c: 3, len: 40 }, { id: 'q', c: 3 + J.JOURNEY.MIN_GAP, len: 40 }]), s = J.journeyReset(st, 1);
  J.journeyStep(s, 0.016, 3, st); J.journeyStep(s, st[0].hold, 3, st);
  const r = J.journeyStep(s, 0.5, 3 + J.JOURNEY.MIN_GAP - 0.01, st);
  assert.ok(r.rate < 0.6, `rate ${r.rate}`);
});

test('journeyReset places the pointer after the current canto so scrubbing never replays or skips wrongly', () => {
  const st = stops();
  assert.equal(J.journeyReset(st, 1).i, 0);
  assert.equal(J.journeyReset(st, 5.2).i, 2);                    // at (b) already: next is b? 5.2 is a, 5.2+gap is b
  assert.equal(J.journeyReset(st, 20).i, 4);
  assert.equal(J.journeyStep(J.journeyReset(st, 20), 0.016, 20, st).rate, 1);
});

test('captionText builds title, subtitle and punishment lines and trims long text on a sentence', () => {
  const node = { n: 'A Title', cap: 'One short line.', note: 'ignored when cap exists' };
  const lv = { name: 'The Lustful', group: 'Circle 2', pun: 'Blown about by an endless storm.' };
  const c = J.captionText(node, lv);
  assert.equal(c.title, 'A Title'); assert.equal(c.sub, 'One short line.');
  assert.match(c.where, /Circle 2/); assert.match(c.pun, /endless storm/);
  const long = J.captionText({ n: 'X', note: 'First sentence here. ' + 'And a much longer second sentence follows it. '.repeat(8) }, lv);
  assert.ok(long.sub.length <= J.JOURNEY.SUB_MAX); assert.match(long.sub, /\.$/);
  const none = J.captionText({ n: 'Y' }, { name: 'Z', group: 'G' });
  assert.equal(none.sub, ''); assert.equal(none.pun, '');
});
