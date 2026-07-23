// Lightweight guard on destructive actions (reset, delete player) so a stray
// tap from someone else in the shared group can't wipe data. Same obscurity
// model as the sync room key in cloud.js — not real auth, just a deterrent.
// The PIN is stored as a SHA-256 hash rather than plaintext so it doesn't
// read directly out of the source/bundle; this app is 100% static client
// code with no backend auth, so this only raises the bar against someone
// casually reading the source — it can't stop an offline brute force of a
// 4-digit hash.
const PIN_HASH = '2fe704a610323b1c0f3375dbeaee0fa1067fde32d0130e24d44a4befdca9679e';

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkPin(input) {
  const hash = await sha256Hex(String(input || '').trim());
  return hash === PIN_HASH;
}
