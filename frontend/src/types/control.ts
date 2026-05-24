import type { StemDefinition } from "@/types/audio";

export type ControlMessage =
  | { type: "SET_INTENSITY"; payload: { value: number } }
  | { type: "LOAD_STEMS"; payload: { stems: StemDefinition[] } }
  | { type: "STOP" };
