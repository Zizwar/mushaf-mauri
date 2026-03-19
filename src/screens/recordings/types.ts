export interface RecordingItem {
  sura: number;
  aya: number;
  uri: string;
  key: string;
}

export type PlayMode = "user" | "compare" | "side_by_side";

export type RecordMode = "tap" | "hold";
