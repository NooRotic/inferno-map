import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The tilt maths lives inside src/index.html between two marker comments (like the journey block), so the page
// stays one self-contained file. This test pulls the block out and runs it in isolation.
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.html'), 'utf8');
const m = /\/\* tilt:begin \*\/([\s\S]*?)\/\* tilt:end \*\//.exec(html);
const T = m ? new Function(`${m[1]}; return { TILT, tiltMatrix, tiltPose, tiltDelta, tiltSpeed, tiltMove, tiltRollGate, tiltLookPitch, tiltHeld };`)() : null;

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

test('tiltMove: tipping the phone past a dead zone from where you hold it moves you, toward you is forward (+), away is back (-)', () => {
  const n = 1.0, df = T.TILT.MOVE_DEAD, db = T.TILT.MOVE_DEAD_BACK, fw = T.TILT.MOVE_MAX, bk = T.TILT.MOVE_MAX_BACK;
  assert.equal(T.tiltMove(n, n), 0);
  assert.equal(T.tiltMove(n - df * 0.99, n), 0); assert.equal(T.tiltMove(n + db * 0.99, n), 0);
  const midF = n - (df + fw) / 2, midB = n + (db + bk) / 2;
  assert.ok(T.tiltMove(midF, n) > 0 && T.tiltMove(midF, n) < 1);
  assert.ok(T.tiltMove(midB, n) < 0 && T.tiltMove(midB, n) > -1);
  near(T.tiltMove(n - fw, n), 1); near(T.tiltMove(n + bk, n), -1); near(T.tiltMove(n - 3, n), 1); near(T.tiltMove(n + 3, n), -1);
  near(T.tiltMove(midF, n), -T.tiltMove(midB, n));   // the same share of each ramp gives the same speed
  assert.ok(T.tiltMove(n - fw * 0.9, n) < T.tiltMove(n - fw, n));
});

test('tiltMove: back needs a bigger tip to start than forward (a back tip was too touchy)', () => {
  assert.ok(T.TILT.MOVE_DEAD_BACK > T.TILT.MOVE_DEAD);
  const a = (T.TILT.MOVE_DEAD + T.TILT.MOVE_DEAD_BACK) / 2;
  assert.ok(T.tiltMove(1 - a, 1) > 0); assert.equal(T.tiltMove(1 + a, 1), 0);
});

// From the owner's phone tests (2026-11-14 and 15, ?tiltdebug): held tips were -12 to -17 degrees forward and +9 to +17 back.
// After the first retune forward still started too late, and back was too touchy.
const deg = (x) => x * Math.PI / 180;
test('tiltMove: forward starts sooner, back waits longer, and both reach full speed within a held tip', () => {
  assert.equal(T.tiltMove(deg(-4), 0), 0, 'a resting hand forward');
  assert.ok(T.tiltMove(deg(-8), 0) > 0.15, 'forward is moving by 8 degrees');
  assert.ok(T.tiltMove(deg(-10), 0) > 0.45, 'forward at 10 degrees');
  assert.ok(T.tiltMove(deg(-14), 0) > 0.95, 'forward at 14 degrees is (nearly) full');
  assert.equal(T.tiltMove(deg(9), 0), 0, 'back at 9 degrees does nothing');
  assert.ok(T.tiltMove(deg(13), 0) < -0.4, 'back at 13 degrees');
  assert.ok(T.tiltMove(deg(16), 0) < -0.95, 'back at 16 degrees is (nearly) full');
});

test('tiltLookPitch: the view follows the phone only until movement starts in that direction, then holds', () => {
  const n = -0.7, df = T.TILT.MOVE_DEAD, db = T.TILT.MOVE_DEAD_BACK;
  near(T.tiltLookPitch(n, n), n);
  near(T.tiltLookPitch(n - df * 0.5, n), n - df * 0.5); near(T.tiltLookPitch(n + db * 0.5, n), n + db * 0.5);
  near(T.tiltLookPitch(n - 1, n), n - df); near(T.tiltLookPitch(n + 1, n), n + db);
  // tipping further does not move the view at all
  near(T.tiltLookPitch(n - df - 0.2, n) - T.tiltLookPitch(n - df - 0.1, n), 0);
  assert.equal(T.tiltHeld(n - df * 0.9, n), false); assert.equal(T.tiltHeld(n - df * 1.1, n), true);
  assert.equal(T.tiltHeld(n + db * 0.9, n), false); assert.equal(T.tiltHeld(n + db * 1.1, n), true);
  // so wherever the phone moves you, the view is held
  for (const t of [-0.3, -0.2, -df * 1.01, db * 1.01, 0.3]) if (T.tiltMove(n + t, n) !== 0) assert.ok(T.tiltHeld(n + t, n), `moving but not held at ${t}`);
});

test('tipping up and down turns the view less than turning around does (it felt like tipping the phone)', () => {
  assert.ok(T.TILT.LOOK_PITCH_GAIN < T.TILT.LOOK_GAIN);
});

test('tiltRollGate: twist is trusted when the phone is near upright and fades out as it aims toward straight up or down', () => {
  assert.equal(T.tiltRollGate(0), 1);
  assert.equal(T.tiltRollGate(T.TILT.ROLL_FADE_START * 0.99), 1); assert.equal(T.tiltRollGate(-T.TILT.ROLL_FADE_START * 0.99), 1);
  const mid = (T.TILT.ROLL_FADE_START + T.TILT.ROLL_FADE_END) / 2;
  assert.ok(T.tiltRollGate(mid) > 0 && T.tiltRollGate(mid) < 1);
  near(T.tiltRollGate(-mid), T.tiltRollGate(mid));
  assert.equal(T.tiltRollGate(T.TILT.ROLL_FADE_END), 0); assert.equal(T.tiltRollGate(Math.PI / 2), 0);
});
