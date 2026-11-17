import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = (...args) => execFileSync(process.execPath, ['tools/build.mjs', ...args], { cwd: root, encoding: 'utf8' });
const dist = (f) => readFileSync(join(root, 'dist', f));
const fixture = join(root, 'tools/fixtures/modern-sample');

test('no flags: the book edition is byte-identical to src', () => {
  build();
  assert.ok(dist('inferno.json').equals(readFileSync(join(root, 'src/inferno.json'))));
  assert.ok(dist('sprites.json').equals(readFileSync(join(root, 'src/sprites.json'))));
  const html = dist('index.html').toString();
  assert.match(html, /og:url" content="https:\/\/inferno\.pollardjr\.com\/"/);
});

test('--data merges nodes, sources and sprites; --site/--title/--desc swap the page meta', () => {
  build('--data', fixture, '--site', 'https://example.test/x', '--title', 'Fixture <Edition>', '--desc', 'Fixture "desc"');
  const d = JSON.parse(dist('inferno.json'));
  assert.ok(d.nodes.some((n) => n.id === 'fx-event' && n.modern === true));
  assert.equal(d.sources['fx-source'].publisher, 'Example Publisher');
  assert.equal(d.meta.coverage.items.length, 2);
  assert.deepEqual(d.meta.legend, [{ icon: 'fx_scroll', label: 'TEST legend entry' }]);
  assert.ok('fx_scroll' in JSON.parse(dist('sprites.json')).sprites);
  const html = dist('index.html').toString();
  assert.match(html, /og:url" content="https:\/\/example\.test\/x\/"/);
  assert.match(html, /<title>Fixture &lt;Edition&gt;<\/title>/);
  assert.match(html, /name="description" content="Fixture &quot;desc&quot;"/);
});

test('--data with a bad node fails the build and names the node', () => {
  const dir = mkdtempSync(join(tmpdir(), 'modern-bad-'));
  cpSync(fixture, dir, { recursive: true });
  const m = JSON.parse(readFileSync(join(dir, 'modern.json'), 'utf8'));
  m.nodes[0].lv = 'nowhere';
  writeFileSync(join(dir, 'modern.json'), JSON.stringify(m));
  assert.throws(() => execFileSync(process.execPath, ['tools/build.mjs', '--data', dir], { cwd: root, stdio: 'pipe' }), (e) => /unknown level "nowhere"/.test(String(e.stderr)));
});

const buildFails = (args) => { try { execFileSync(process.execPath, ['tools/build.mjs', ...args], { cwd: root, stdio: 'pipe' }); return null; } catch (e) { return String(e.stderr); } };

test('--data with a missing directory, no value, or no modern.json fails instead of building an empty edition', () => {
  assert.match(buildFails(['--data', join(tmpdir(), 'no-such-modern-dir-xyz')]) || '', /--data: .* is not a directory/);
  assert.match(buildFails(['--data']) || '', /--data needs a directory/);
  assert.match(buildFails(['--data', '--site', 'https://example.test/']) || '', /--data needs a directory/);
  const empty = mkdtempSync(join(tmpdir(), 'modern-empty-'));
  assert.match(buildFails(['--data', empty]) || '', /modern\.json not found/);
});

// Visit counting (Matomo on stats.pollardjr.com). It must count only the poem edition's own address, set no cookies, and stay
// silent for a visitor who sends Do Not Track or Global Privacy Control. The page shows its "what is counted" note only when counting.
const runCounter = (html, { hostname, gpc, dnt }) => {
  const m = html.match(/<!-- Matomo -->\s*<script>([\s\S]*?)<\/script>\s*<!-- End Matomo -->/);
  assert.ok(m, 'the Matomo block is in the page');
  const inserted = [], classes = new Set(), win = {};
  const first = { parentNode: { insertBefore: (el) => inserted.push(el) } };
  const doc = { documentElement: { classList: { add: (c) => classes.add(c) } }, createElement: () => ({}), getElementsByTagName: () => [first] };
  runInNewContext(m[1], { window: win, document: doc, location: { hostname }, navigator: { globalPrivacyControl: gpc, doNotTrack: dnt } });
  return { paq: win._paq ? JSON.parse(JSON.stringify(win._paq)) : undefined, scripts: inserted.map((s) => s.src), counted: classes.has('counted') };
};

test('the book edition counts visits on inferno.pollardjr.com only: no cookies, site 3, tracker script from stats.pollardjr.com', () => {
  build();
  const r = runCounter(dist('index.html').toString(), { hostname: 'inferno.pollardjr.com' });
  assert.ok(r.paq.some((c) => c[0] === 'disableCookies'));
  assert.ok(r.paq.some((c) => c[0] === 'setDoNotTrack' && c[1] === true));
  assert.deepEqual(r.paq.find((c) => c[0] === 'setSiteId'), ['setSiteId', '3']);
  assert.deepEqual(r.paq.find((c) => c[0] === 'setTrackerUrl'), ['setTrackerUrl', 'https://stats.pollardjr.com/matomo.php']);
  assert.ok(r.paq.some((c) => c[0] === 'trackPageView'));
  assert.deepEqual(r.scripts, ['https://stats.pollardjr.com/matomo.js']);
  assert.equal(r.counted, true);
});

test('counting does nothing on any other address, or for Do Not Track or Global Privacy Control', () => {
  const html = dist('index.html').toString();
  for (const v of [{ hostname: 'inferno.nooroticx.tv' }, { hostname: 'localhost' }, { hostname: 'inferno.pollardjr.com', gpc: true }, { hostname: 'inferno.pollardjr.com', dnt: '1' }]) {
    const r = runCounter(html, v);
    assert.equal(r.paq, undefined, JSON.stringify(v));
    assert.deepEqual(r.scripts, [], JSON.stringify(v));
    assert.equal(r.counted, false, JSON.stringify(v));
  }
});

test('the intro carries one plain note about what is counted, shown only while counting', () => {
  const html = dist('index.html').toString();
  assert.match(html, /<p class="counted-note">Visits are counted by Matomo on my own server, with no cookies and shortened IP addresses\.<\/p>/);
  assert.match(html, /\.counted-note\s*\{[^}]*display:\s*none/);
  assert.match(html, /html\.counted\s+#incipit\s+p\.counted-note\s*\{[^}]*display:\s*block/);
  assert.ok(!/—/.test(html.match(/<p class="counted-note">[^<]*<\/p>/)[0]), 'no em dash in the note');
});
