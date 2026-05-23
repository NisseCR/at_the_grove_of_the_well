import * as audio from "@/lib/audioEngine";

// This is the only file components talk to.
// When WebSockets are added, replace the bodies here — nothing else changes.

export const setIntensity = (value: number) => audio.setIntensity(value);
export const loadStems = audio.loadStems;
export const stop = audio.stop;
