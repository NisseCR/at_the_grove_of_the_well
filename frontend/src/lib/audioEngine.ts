import * as Tone from "tone";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StemDefinition {
  id: string;
  url: string;
}

// ── State ────────────────────────────────────────────────────────────────────

const players: Tone.Player[] = [];
let stemCount = 0;
let started = false;

const FADE = 4; // crossfade duration in seconds

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureStarted(): Promise<void> {
  if (!started) {
    await Tone.start();
    started = true;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Load 1–3 stems. Call once on startup.
 * All stems loop silently until setIntensity() brings them in.
 */
export async function loadStems(stems: StemDefinition[]): Promise<void> {
  await ensureStarted();

  // Dispose any previously loaded players
  players.forEach((p) => {
    p.stop();
    p.dispose();
  });
  players.length = 0;

  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  for (const stem of stems.slice(0, 3)) {
    const player = new Tone.Player({
      url: stem.url,
      loop: true,
      autostart: false,
    }).toDestination();

    player.volume.value = -Infinity; // start silent
    player.sync().start(0);
    players.push(player);
  }

  await Tone.loaded();

  stemCount = players.length;
  Tone.getTransport().start();
}

/**
 * Intensity: 0–1.
 *
 * Maps to stems as follows:
 *   0.00–0.33  → only stem 1 audible
 *   0.34–0.66  → stems 1–2 audible
 *   0.67–1.00  → stems 1–3 audible
 *
 * Each active stem fades in; inactive stems fade out.
 * Stem 1 also gets louder as intensity rises within its range.
 */
export function setIntensity(intensity: number): void {
  if (players.length === 0) return;

  // How many stems should be audible at this intensity
  const active = Math.ceil(intensity * stemCount);

  players.forEach((player, i) => {
    if (i < active) {
      // Scale volume within the stem's "zone"
      const zoneSize = 1 / stemCount;
      const zoneStart = i * zoneSize;
      const localIntensity = Math.min(1, (intensity - zoneStart) / zoneSize);
      const db = Tone.gainToDb(0.4 + localIntensity * 0.6); // ramp 40%→100%
      player.volume.rampTo(db, FADE);
    } else {
      player.volume.rampTo(-Infinity, FADE);
    }
  });
}

/** Stop all stems and reset. */
export function stop(): void {
  players.forEach((p) => p.volume.rampTo(-Infinity, FADE));
  setTimeout(() => {
    Tone.getTransport().stop();
  }, FADE * 1000);
}
