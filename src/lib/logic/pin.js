// Lightweight guard on destructive actions (reset, delete player) so a stray
// tap from someone else in the shared group can't wipe data. Same obscurity
// model as the sync room key in cloud.js — not real auth, just a deterrent.
export const ADMIN_PIN = '6284';

export function checkPin(input) {
  return String(input || '').trim() === ADMIN_PIN;
}
