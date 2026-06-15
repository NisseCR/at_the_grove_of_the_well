import * as Tone from "tone";

/** A loaded audio stem with two independent gain nodes in series. */
export interface Stem {
  /** The audio source node. */
  player: Tone.Player;
  /** Gain node for cinematic fades; driven by transition(). Starts at 0. */
  rampGain: Tone.Gain;
  /** Gain node for instant user-slider adjustments; driven by setVolume(). Starts at 1. */
  volumeGain: Tone.Gain;
  /** The URL of the audio file. */
  url: string;
}
