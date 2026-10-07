// Build: wraps src/index.html (artifact form, no <html>/<head>) into a standalone page in dist/.
// Usage:  node tools/build.mjs            -> three.js from cdnjs (same as the artifact)
//         node tools/build.mjs --vendor   -> three.js copied into dist/vendor (no third-party script host)
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = process.argv.includes('--vendor');
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

await rm(join(root, 'dist'), { recursive: true, force: true });
await mkdir(join(root, 'dist'), { recursive: true });

let body = await readFile(join(root, 'src/index.html'), 'utf8');
const title = (body.match(/<title>[\s\S]*?<\/title>/) || ['<title>Inferno</title>'])[0];
body = body.replace(title, '');
const SITE = 'https://inferno.pollardjr.com/';
const DESC = "A cutaway 3D model of Dante's Hell inside the Earth, with every soul and landmark cited by canto and line.";
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
for (const f of ['inferno.json', 'sprites.json', 'og.png']) await copyFile(join(root, 'src', f), join(root, 'dist', f));
console.log(`dist/ built${vendor ? ' (three.js vendored)' : ''}`);
