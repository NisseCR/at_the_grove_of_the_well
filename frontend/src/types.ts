export interface StemDefinition {
  id: string;
  url: string;
}

export type ControlMessage =
  | { type: "SET_INTENSITY"; payload: { value: number } }
  | { type: "LOAD_STEMS"; payload: { stems: StemDefinition[] } }
  | { type: "STOP" };
