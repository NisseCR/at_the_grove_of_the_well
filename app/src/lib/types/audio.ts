import * as Tone from "tone";
import type { TargetGain } from "$lib/types/state";

export interface GainControl {
  node: Tone.Gain;
  target: TargetGain;
}

/** A loaded audio stem with two independent gain nodes in series. */
export interface Stem {
  url: string;
  player: Tone.Player;

  /** Gain node for cinematic fades. Starts at 0. */
  rampGain: GainControl;

  /** Gain node for instant user-slider adjustments. Starts at 1. */
  volumeGain: GainControl;
}
