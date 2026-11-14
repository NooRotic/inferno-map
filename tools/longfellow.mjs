// Longfellow's Inferno (1867, Project Gutenberg #1001) as numbered lines, for checking citations and quotes.
// Longfellow translated line for line, so his line numbers are Dante's; parse() proves it by matching
// every canto's line count against the Italian.
//
//   node tools/longfellow.mjs fetch             download the text to .cache/pg1001.txt (once; .cache is gitignored)
//   node tools/longfellow.mjs XXVIII 139-142    print those lines
//   node tools/longfellow.mjs find counterpoise print every line containing the words
//   node tools/longfellow.mjs check             check every quote in src/inferno.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE = join(ROOT, '.cache', 'pg1001.txt');
const SOURCE = 'https://www.gutenberg.org/cache/epub/1001/pg1001.txt';

// Lines per canto in the Italian text, I to XXXIV.
export const LINE_COUNTS = [136, 142, 136, 151, 142, 115, 130, 130, 133, 136, 115, 139, 151, 142, 124, 136, 136,
  136, 133, 130, 139, 151, 148, 151, 151, 142, 136, 142, 139, 148, 145, 139, 157, 139];

export const roman = (n) => {
  let s = '';
  for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; }
  return s;
};

/** Gutenberg text -> { I: [line1, line2, ...], II: [...], ... } (blank lines dropped). */
export function parse(raw) {
  const body = raw.replace(/\r/g, '').split('*** END OF')[0];
  const parts = body.split(/^Inferno: Canto ([IVXL]+)\s*$/m);
  const cantos = {};
  for (let i = 1; i < parts.length; i += 2) cantos[parts[i]] = parts[i + 1].split('\n').map((l) => l.trim()).filter(Boolean);
  return cantos;
}

/** Cantos whose line count differs from the Italian (empty when the numbering is sound). */
export const countMismatches = (cantos) =>
  LINE_COUNTS.map((n, i) => [roman(i + 1), n]).filter(([c, n]) => (cantos[c] || []).length !== n);

/** Lower-case, curly apostrophes made straight, punctuation dropped, so a quote matches across line breaks. */
export const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The normalised text of a citation such as "V.73-142", "XXXIV.67" or "XXXII.124–XXXIII.90"; null if unparseable. */
export function span(cantos, cite) {
  const m = /^([IVXL]+)\.(\d+)(?:[-–](?:([IVXL]+)\.)?(\d+))?$/.exec(cite);
  if (!m) return null;
  const order = Object.keys(cantos);
  const [c1, a] = [m[1], +m[2]], [c2, b] = [m[3] || m[1], m[4] ? +m[4] : +m[2]];
  const i = order.indexOf(c1), j = order.indexOf(c2);
  if (i < 0 || j < i) return null;
  const out = [];
  for (let k = i; k <= j; k++) {
    const lines = cantos[order[k]];
    out.push(...lines.slice((k === i ? a : 1) - 1, k === j ? b : lines.length));
  }
  return norm(out.join(' '));
}

const quoted = (s) => [...(s || '').matchAll(/“([^”]+)”/g)].map((m) => m[1]);

/**
 * Every English quote in the book data must be Longfellow's: an `en` line must sit inside its node's citation,
 * and any phrase in curly quotes in a note, caption, torment, contrapasso, level `pun` or scene note must appear
 * somewhere in Hell. Returns a list of problems (empty when all is well).
 */
export function quoteProblems(data, cantos) {
  const all = norm(Object.values(cantos).map((l) => l.join(' ')).join(' '));
  const problems = [];
  for (const n of data.nodes || []) {
    const sp = span(cantos, n.cite);
    if (!sp) { problems.push(`${n.id}: cite ${n.cite} does not parse`); continue; }
    for (const part of (n.en || '').split(' / ').filter(Boolean)) {
      if (!sp.includes(norm(part))) problems.push(`${n.id}: en "${part}" is not in ${n.cite}`);
    }
    for (const f of ['note', 'cap', 'torment', 'contrapasso']) {
      for (const q of quoted(n[f])) if (!all.includes(norm(q))) problems.push(`${n.id}.${f}: “${q}” is not Longfellow`);
    }
  }
  for (const l of data.levels || []) for (const q of quoted(l.pun)) if (!all.includes(norm(q))) problems.push(`level ${l.id}.pun: “${q}” is not Longfellow`);
  for (const t of data.tableaux || []) for (const q of quoted(t.note)) if (!all.includes(norm(q))) problems.push(`scene ${t.id}.note: “${q}” is not Longfellow`);
  return problems;
}

export const loadCached = () => (existsSync(CACHE) ? parse(readFileSync(CACHE, 'utf8')) : null);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'fetch') {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`Gutenberg answered ${res.status}`);
    const raw = await res.text();
    const bad = countMismatches(parse(raw));
    if (bad.length) throw new Error('unexpected text: line counts differ in ' + bad.map(([c]) => c).join(', '));
    mkdirSync(dirname(CACHE), { recursive: true });
    writeFileSync(CACHE, raw);
    console.log(`saved ${CACHE}; all 34 cantos match the Italian line counts`);
  } else {
    const cantos = loadCached();
    if (!cantos) { console.error('no text yet: run node tools/longfellow.mjs fetch'); process.exit(1); }
    if (cmd === 'check') {
      const data = JSON.parse(readFileSync(join(ROOT, 'src', 'inferno.json'), 'utf8'));
      const p = quoteProblems(data, cantos);
      p.forEach((x) => console.log(x));
      console.log(p.length ? `${p.length} problem(s)` : 'every quote is Longfellow');
      process.exit(p.length ? 1 : 0);
    } else if (cmd === 'find') {
      const q = norm(process.argv.slice(3).join(' '));
      for (const [c, lines] of Object.entries(cantos)) lines.forEach((l, i) => { if (norm(l).includes(q)) console.log(`${c}.${i + 1}: ${l}`); });
    } else if (cmd && cantos[cmd]) {
      const [a, b] = (arg || '1').split('-').map(Number);
      for (let i = a; i <= (b || a); i++) console.log(`${cmd}.${i}: ${cantos[cmd][i - 1] ?? '(past the end)'}`);
    } else {
      console.error('usage: fetch | check | find <words> | <CANTO> <from>[-<to>]');
      process.exit(1);
    }
  }
}
