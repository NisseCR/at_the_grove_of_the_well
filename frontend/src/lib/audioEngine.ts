import * as Tone from "tone";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StemDefinition {
  id: string;
  url: string;
}

interface LoadedStem {
  player: Tone.Player;
  gain: Tone.Gain;
}

// ── State ────────────────────────────────────────────────────────────────────

const stems: LoadedStem[] = [];
let started = false;

const FADE = 4; // seconds

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureStarted(): Promise<void> {
  if (!started) {
    await Tone.start();
    started = true;
  }
}

function disposeAll(): void {
  stems.forEach(({ player, gain }) => {
    player.stop();
    player.dispose();
    gain.dispose();
  });
  stems.length = 0;
}

/**
 * Ramp a gain node to a target value (0–1) over FADE seconds.
 * Uses an explicit setValueAtTime anchor before the ramp — required for
 * Firefox to interpolate smoothly rather than stepping in chunks.
 */
function fadeTo(gain: Tone.Gain, target: number): void {
  const now = Tone.now();
  const param = gain.gain;
  param.cancelAndHoldAtTime(now);
  param.linearRampToValueAtTime(target, now + FADE);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Load 1–3 stems. All start silent.
 * Call setIntensity() after loading to bring stems in.
 */
export async function loadStems(definitions: StemDefinition[]): Promise<void> {
  await ensureStarted();
  disposeAll();

  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  for (const def of definitions.slice(0, 3)) {
    const gain = new Tone.Gain(0).toDestination(); // start silent
    const player = new Tone.Player({
      url: def.url,
      loop: true,
      autostart: false,
    }).connect(gain);

    player.sync().start(0);
    stems.push({ player, gain });
  }

  await Tone.loaded();
  Tone.getTransport().start();
}

/**
 * Intensity: 0–1.
 *
 * Maps to stems as follows (for 3 stems):
 *   0.00–0.33  → only stem 1 audible
 *   0.34–0.66  → stems 1–2 audible
 *   0.67–1.00  → stems 1–3 audible
 *
 * Volume scales gradually within each zone so the fade feels
 * progressive rather than a sudden jump at each threshold.
 */
export function setIntensity(intensity: number): void {
  if (stems.length === 0) return;

  const zoneSize = 1 / stems.length;

  stems.forEach(({ gain }, i) => {
    const zoneStart = i * zoneSize;

    if (intensity > zoneStart) {
      const localIntensity = Math.min(1, (intensity - zoneStart) / zoneSize);
      fadeTo(gain, 0.4 + localIntensity * 0.6); // ramp 40%→100% within zone
    } else {
      fadeTo(gain, 0);
    }
  });
}

/** Fade out all stems and stop the transport. */
export function stop(): void {
  stems.forEach(({ gain }) => fadeTo(gain, 0));
  setTimeout(() => {
    Tone.getTransport().stop();
  }, FADE * 1000);
}
