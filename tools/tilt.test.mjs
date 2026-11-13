import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The tilt maths lives inside src/index.html between two marker comments (like the journey block), so the page
// stays one self-contained file. This test pulls the block out and runs it in isolation.
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.html'), 'utf8');
const m = /\/\* tilt:begin \*\/([\s\S]*?)\/\* tilt:end \*\//.exec(html);
const T = m ? new Function(`${m[1]}; return { TILT, tiltMatrix, tiltPose, tiltDelta, tiltSpeed, tiltMove };`)() : null;

test('the tilt block exists in index.html', () => assert.ok(m, 'missing tilt:begin / tilt:end markers'));

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`);
const pose = (a, b, g, orient = 0) => T.tiltPose(T.tiltMatrix(a, b, g), orient);
// turn the device about its own screen-normal axis by phi radians (counter-clockwise as the viewer sees it)
const twist = (R, phi) => R.map((row) => [Math.cos(phi) * row[0] + Math.sin(phi) * row[1], -Math.sin(phi) * row[0] + Math.cos(phi) * row[1], row[2]]);

test('an upright phone facing north looks level along the scene\'s -z axis', () => {
  const p = pose(0, 90, 0);
  near(p.yaw, -Math.PI / 2); near(p.pitch, 0); near(p.roll, 0);
});

test('turning the phone to the left (alpha up) turns the view left; to the right, right', () => {
  near(Math.abs(pose(90, 90, 0).yaw), Math.PI);   // west
  near(pose(270, 90, 0).yaw, 0);                  // east
});

test('tipping the top of the phone back looks down, and forward looks up', () => {
  const back = pose(0, 45, 0); near(back.pitch, -Math.PI / 4); near(back.yaw, -Math.PI / 2);
  near(pose(0, 135, 0).pitch, Math.PI / 4);
});

test('roll is positive with the right edge down, negative with it up, zero when level', () => {
  assert.ok(pose(0, 60, 20).roll > 0.1);
  assert.ok(pose(0, 60, -20).roll < -0.1);
  near(pose(0, 60, 0).roll, 0);
});

test('twisting the phone about its screen normal changes roll by the same angle', () => {
  const R = T.tiltMatrix(40, 60, 0);
  near(T.tiltPose(twist(R, 0.3), 0).roll, T.tiltPose(R, 0).roll - 0.3);
  near(T.tiltPose(twist(R, 0.3), 0).yaw, T.tiltPose(R, 0).yaw);   // the look direction does not move
});

test('landscape: a phone turned on its side reads level when the screen angle says so', () => {
  const R = twist(T.tiltMatrix(0, 60, 0), Math.PI / 2);   // physically turned to landscape-left
  near(T.tiltPose(R, 90).roll, 0);
  near(T.tiltPose(R, 0).roll, -Math.PI / 2);
  near(T.tiltPose(twist(T.tiltMatrix(0, 60, 0), -Math.PI / 2), 270).roll, 0);   // landscape-right
});

test('tiltDelta takes the short way round the compass', () => {
  near(T.tiltDelta({ yaw: 3.1, pitch: 0 }, { yaw: -3.1, pitch: 0.1 }).dyaw, 2 * Math.PI - 6.2);
  near(T.tiltDelta({ yaw: -3.1, pitch: 0 }, { yaw: 3.1, pitch: 0 }).dyaw, -(2 * Math.PI - 6.2));
  near(T.tiltDelta({ yaw: 0, pitch: 0.2 }, { yaw: 0, pitch: 0.5 }).dpitch, 0.3);
});

test('tiltSpeed: a dead zone, then a smooth ramp, full at the limit, symmetric', () => {
  assert.equal(T.tiltSpeed(0), 0);
  assert.equal(T.tiltSpeed(T.TILT.ROLL_DEAD * 0.99), 0);
  const a = T.tiltSpeed((T.TILT.ROLL_DEAD + T.TILT.ROLL_MAX) / 2);
  assert.ok(a > 0 && a < 1);
  near(T.tiltSpeed(T.TILT.ROLL_MAX), 1); near(T.tiltSpeed(3), 1);
  const lo = T.TILT.ROLL_DEAD + (T.TILT.ROLL_MAX - T.TILT.ROLL_DEAD) * 0.3, hi = T.TILT.ROLL_DEAD + (T.TILT.ROLL_MAX - T.TILT.ROLL_DEAD) * 0.7;
  near(T.tiltSpeed(-lo), -T.tiltSpeed(lo));
  assert.ok(T.tiltSpeed(lo) < T.tiltSpeed(hi));
});

test('tiltMove: tipping the phone past a dead zone from where you hold it moves you, away is forward, toward you is back', () => {
  const n = 1.0, d = T.TILT.MOVE_DEAD, mx = T.TILT.MOVE_MAX;
  assert.equal(T.tiltMove(n, n), 0);
  assert.equal(T.tiltMove(n + d * 0.99, n), 0); assert.equal(T.tiltMove(n - d * 0.99, n), 0);
  const mid = n + (d + mx) / 2;
  assert.ok(T.tiltMove(mid, n) > 0 && T.tiltMove(mid, n) < 1);
  near(T.tiltMove(n + mx, n), 1); near(T.tiltMove(n - mx, n), -1); near(T.tiltMove(n + 3, n), 1);
  near(T.tiltMove(n - (mid - n), n), -T.tiltMove(mid, n));
  assert.ok(T.tiltMove(mid, n) < T.tiltMove(n + mx, n));
});
