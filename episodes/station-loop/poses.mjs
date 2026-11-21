import assert from 'node:assert/strict';
import { floor, fps, gaitAt, rigAt } from '../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 12;
export const povStart = 78;
export const returnStart = 126;
export const ticketStart = 204;
export const reactionStart = 240;

const ankle = (x) => [x, floor - 18, 0];
const key = (frame, ...values) => [frame / fps, ...values];
const walk = (frame, origin) => gaitAt('walk', frame).map(([part, x, y, angle]) =>
  [part, x + origin - 270 + 145 * frame / 28, y, angle]);

function settle(frame, origin, lastStep, reaching) {
  const last = walk(lastStep, origin);
  const [x, y, angle] = last.find(([part]) => part === 'pelvis').slice(1);
  const far = last.find(([part]) => part === 'foot-far').slice(1);
  const near = last.find(([part]) => part === 'foot-near').slice(1);
  const farWrist = last.find(([part]) => part === 'hand-far').slice(1, 3);
  const nearWrist = last.find(([part]) => part === 'hand-near').slice(1, 3);
  const restX = x + (reaching ? 22 : 15);
  const nearLanding = ankle(x + 27);
  const scene = {
    pelvis: [key(0, x, y, angle), key(6, x + 11, y + 5, 2),
      key(16, restX, reaching ? 543 : 550, reaching ? 4 : -3),
      key(32, restX, reaching ? 543 : 541, 1), key(94, restX, reaching ? 543 : 537, 1)],
    chest: [key(0,4), key(8,reaching ? 12 : -9), key(19,reaching ? 16 : -12),
      key(34,reaching ? 16 : -2), key(62,reaching ? 16 : 1)],
    neck: [key(0,2), key(12,reaching ? 6 : -9), key(26,reaching ? 6 : -3)],
    head: [key(0,-3), key(11,reaching ? 0 : -7), key(32,reaching ? 0 : 4),
      key(53,0), key(82,0), key(95,reaching ? 0 : -9), key(109,reaching ? 0 : -4)],
    shoulder: [key(0,0,0), key(26,reaching ? 10 : 0,0)],
    elbowBends: [1,1],
    feet: (t) => {
      const frame = t * fps;
      const amount = Math.min(frame / 4, 1);
      const rock = far[2] * (1 - amount);
      const heel = far[0] - 18 * Math.cos(far[2] * Math.PI / 180) - 18 * Math.sin(far[2] * Math.PI / 180);
      const roll = rock * Math.PI / 180;
      const front = [heel + 18 * Math.cos(roll) + 18 * Math.sin(roll),
        floor + 18 * Math.sin(roll) - 18 * Math.cos(roll), rock];
      const swing = Math.max(0, Math.min((frame - 1) / 13, 1));
      const back = near.map((value, axis) => value + (nearLanding[axis] - value) * swing);
      back[1] -= 24 * Math.sin(Math.PI * swing);
      return [front, back];
    },
    far: [key(0,...farWrist), key(14,restX-24,reaching ? 551 : 535),
      key(34,restX-19,reaching ? 551 : 549)],
    near: reaching ? [key(0,...nearWrist), key(12,restX+36,506,-13), key(35,restX+86,476,-9)]
      : [key(0,...nearWrist), key(12,restX+42,518,-13), key(34,restX+23,548,55)],
    nearHand: reaching ? [key(18,'hand-brace')] : undefined,
    expression: reaching ? [] : [key(5,'head-notice')],
  };
  return rigAt(scene, frame);
}

export function stationPose(frame) {
  if (frame >= povStart && frame < returnStart) return [];
  if (frame >= ticketStart && frame < reactionStart) return [];
  if (frame < 42) return walk(frame, 153);
  if (frame < povStart) return settle(frame - 42, 153, 42, true);
  const local = frame - returnStart;
  if (local < 14) return walk(local + 28, -54);
  return settle(local - 14 - (frame >= reactionStart ? reactionStart - ticketStart + 1 : 0), -54, 42, false);
}

assert.equal(stationPose(povStart).length, 0);
assert.deepEqual(stationPose(ticketStart - 1), stationPose(reactionStart));
