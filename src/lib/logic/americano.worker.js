// Runs the (potentially multi-second) schedule search off the main thread,
// so the UI — including the "Mixing…" spinner — stays responsive instead of
// freezing for the duration of the search. `americano.js` has zero external
// dependencies, so it runs here unmodified.
import { generateSchedule } from './americano.js';

self.onmessage = (e) => {
  const { playerIds, rounds } = e.data;
  try {
    const result = generateSchedule(playerIds, rounds);
    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
