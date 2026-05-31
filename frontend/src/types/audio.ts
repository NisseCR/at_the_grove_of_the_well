import * as Tone from "tone";

/** A loaded audio stem with its own gain node for volume control. */
export interface Stem {
  /** The audio source node. */
  player: Tone.Player;
  /** Gain node used for fading; connected directly to the destination. */
  gain: Tone.Gain;
  /** The URL of the audio file. */
  url: string;
}
