// Build: wraps src/index.html (artifact form, no <html>/<head>) into a standalone page in dist/.
// Usage:  node tools/build.mjs            -> three.js from cdnjs (same as the artifact)
//         node tools/build.mjs --vendor   -> three.js copied into dist/vendor (no third-party script host)
import { readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = process.argv.includes('--vendor');
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const dataDir = arg('--data'), siteArg = arg('--site'), titleArg = arg('--title'), descArg = arg('--desc');
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

if (process.argv.includes('--data')) {   // a mistyped or missing --data must fail, never build an empty "modern" edition
  if (!dataDir || dataDir.startsWith('--')) throw new Error('--data needs a directory');
  const st = await stat(resolve(dataDir)).catch(() => null);
  if (!st || !st.isDirectory()) throw new Error(`--data: ${resolve(dataDir)} is not a directory`);
  if (!(await stat(join(resolve(dataDir), 'modern.json')).catch(() => null))) throw new Error(`--data: modern.json not found in ${resolve(dataDir)}`);
}

await rm(join(root, 'dist'), { recursive: true, force: true });
await mkdir(join(root, 'dist'), { recursive: true });

let body = await readFile(join(root, 'src/index.html'), 'utf8');
const title = titleArg ? `<title>${escHtml(titleArg)}</title>` : (body.match(/<title>[\s\S]*?<\/title>/) || ['<title>Inferno</title>'])[0];
body = body.replace(/<title>[\s\S]*?<\/title>/, '');
const SITE = siteArg ? siteArg.replace(/\/?$/, '/') : 'https://inferno.pollardjr.com/';
const DESC = escHtml(descArg || "A cutaway 3D model of Dante's Hell inside the Earth, with every soul and landmark cited by canto and line.");
const pageTitle = title.replace(/<\/?title>/g, '').trim();
if (vendor) {
  await mkdir(join(root, 'dist/vendor'), { recursive: true });
  await copyFile(join(root, 'vendor/three-r128/three.min.js'), join(root, 'dist/vendor/three.min.js'));
  body = body.replace(CDN, 'vendor/three.min.js');
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${title}
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#110c08">
<!-- favicon: SVG for current browsers, ICO fallback, touch icon for iOS. Regenerate with tools/make-favicon.py. Relative paths so a subfolder deploy works. -->
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<!-- link preview: og:image must be an absolute URL; bump ?v= whenever src/og.png changes so platforms re-fetch it -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="INFERNVS">
<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}og.png?v=1">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Cutaway of Dante's Hell inside the Earth, ringed terraces colored by sin and marked with small icons for souls and guardians.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${pageTitle}">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${SITE}og.png?v=1">
<style>body{margin:0}</style>
</head>
<body>
${body.trim()}
</body>
</html>
`;
await writeFile(join(root, 'dist/index.html'), html);
for (const f of ['inferno.json', 'sprites.json', 'og.png', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) await copyFile(join(root, 'src', f), join(root, 'dist', f));
if (dataDir) {
  const { mergeModern } = await import('./merge-modern.mjs');
  const dir = resolve(dataDir);
  const rd = async (f, d) => { try { return JSON.parse(await readFile(join(dir, f), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return d; throw e; } };
  const mod = await rd('modern.json', { nodes: [] });
  const modern = { nodes: mod.nodes || [], edges: mod.edges || [], sources: await rd('sources.json', []), coverage: await rd('coverage.json', null), legend: mod.legend };
  const baseData = JSON.parse(await readFile(join(root, 'src/inferno.json'), 'utf8'));
  const baseSprites = JSON.parse(await readFile(join(root, 'src/sprites.json'), 'utf8'));
  const { data, sprites } = mergeModern(baseData, modern, baseSprites, await rd('modern-sprites.json', {}));
  await writeFile(join(root, 'dist/inferno.json'), JSON.stringify(data));
  await writeFile(join(root, 'dist/sprites.json'), JSON.stringify(sprites));
  try { await copyFile(join(dir, 'og.png'), join(root, 'dist/og.png')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
console.log(`dist/ built${vendor ? ' (three.js vendored)' : ''}${dataDir ? ' (modern data merged)' : ''}`);
