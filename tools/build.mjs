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
<meta name="description" content="A cutaway 3D model of Dante's Hell inside the Earth, with every soul and landmark cited by canto and line.">
<style>body{margin:0}</style>
</head>
<body>
${body.trim()}
</body>
</html>
`;
await writeFile(join(root, 'dist/index.html'), html);
for (const f of ['inferno.json', 'sprites.json']) await copyFile(join(root, 'src', f), join(root, 'dist', f));
console.log(`dist/ built${vendor ? ' (three.js vendored)' : ''}`);
