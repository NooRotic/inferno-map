import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

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
