import * as Tone from "tone";

/** A loaded audio stem with two independent gain nodes in series. */
export interface Stem {
  player: Tone.Player;

  /** Gain node for cinematic fades. Starts at 0. */
  rampGain: Tone.Gain;

  /** Gain node for instant user-slider adjustments. Starts at 1. */
  volumeGain: Tone.Gain;

  url: string;
}
