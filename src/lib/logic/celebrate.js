import confetti from 'canvas-confetti';

const NEON = ['#b6ff2e', '#d4ff4d', '#22e0c8', '#f5ff3d', '#56c8ff'];

// A satisfying two-burst neon explosion for session finalize.
export function celebrate() {
  const base = { colors: NEON, disableForReducedMotion: true, zIndex: 9999 };
  confetti({ ...base, particleCount: 120, spread: 75, origin: { y: 0.6 } });
  setTimeout(() => {
    confetti({ ...base, particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ ...base, particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
  }, 180);
}

// Small pop for minor wins (logging a match).
export function pop(x = 0.5, y = 0.5) {
  confetti({
    colors: NEON,
    particleCount: 40,
    spread: 60,
    startVelocity: 28,
    origin: { x, y },
    disableForReducedMotion: true,
    zIndex: 9999,
  });
}
