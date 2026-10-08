"""Regenerate the favicon files from Lucifer's red pixel face in src/sprites.json.

    python tools/make-favicon.py

Writes src/favicon.svg, src/favicon.ico (16, 32, 48 px) and src/apple-touch-icon.png (180 px).
The icon is the 16x16 face sprite, outlined like the engine outlines every sprite, on a dark
rounded square with a gold border. tools/build.mjs copies these into dist/.
"""
import json
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'src')
BG, GOLD = '#110c08', '#b8892a'

spec = json.load(open(os.path.join(SRC, 'sprites.json'), encoding='utf-8'))
pal = spec['palette']
grid = spec['sprites']['lucifer_face_red']['grid']
N = 16


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


filled = lambda x, y: 0 <= x < N and 0 <= y < N and grid[y][x] != '.'

# 16x16 pixel map: colour per pixel, None = transparent
px = [[None] * N for _ in range(N)]
for y in range(N):
    for x in range(N):
        edge = x in (0, N - 1) or y in (0, N - 1)
        corner = (x in (0, N - 1)) and (y in (0, N - 1))
        px[y][x] = None if corner else (GOLD if edge else BG)
for y in range(N):                       # the sprite's 1px outline, then its pixels
    for x in range(N):
        if not filled(x, y) and (filled(x - 1, y) or filled(x + 1, y) or filled(x, y - 1) or filled(x, y + 1)):
            px[y][x] = pal['k']
for y in range(N):
    for x in range(N):
        if filled(x, y):
            px[y][x] = pal[grid[y][x]]


def image(scale):
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for y in range(N):
        for x in range(N):
            if px[y][x]:
                im.putpixel((x, y), hexrgb(px[y][x]) + (255,))
    return im.resize((N * scale, N * scale), Image.NEAREST)


# SVG: horizontal runs of one colour, crisp edges, scales to any size
rects = []
for y in range(N):
    x = 0
    while x < N:
        c = px[y][x]
        if c is None:
            x += 1
            continue
        x2 = x
        while x2 + 1 < N and px[y][x2 + 1] == c:
            x2 += 1
        rects.append('<rect x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (x, y, x2 - x + 1, c))
        x = x2 + 1
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">\n  %s\n</svg>\n' % '\n  '.join(rects)
open(os.path.join(SRC, 'favicon.svg'), 'w', encoding='utf-8').write(svg)

# ICO with 16, 32 and 48 px frames (nearest-neighbour, so the pixels stay sharp)
frames = [image(1), image(2), image(3)]
frames[2].save(os.path.join(SRC, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:2])

# Apple touch icon: iOS wants an opaque square, so full-bleed background and the face at 10x with padding
tile = Image.new('RGBA', (180, 180), hexrgb(BG) + (255,))
face = Image.new('RGBA', (N, N), (0, 0, 0, 0))
for y in range(N):
    for x in range(N):
        c = px[y][x]
        if c and c not in (BG, GOLD):
            face.putpixel((x, y), hexrgb(c) + (255,))
face = face.resize((160, 160), Image.NEAREST)
tile.alpha_composite(face, (10, 10))
tile.convert('RGB').save(os.path.join(SRC, 'apple-touch-icon.png'), optimize=True)
print('wrote favicon.svg, favicon.ico, apple-touch-icon.png')
