import type { GeneratedOffset } from "./types";
export declare function shiftPositionByOffset<T extends {
  readonly line?: null | number;
  readonly column?: null | number;
}>(pos: T, offset: GeneratedOffset): T;
export declare function subtractOffsetFromPosition<T extends {
  readonly line?: null | number;
  readonly column?: null | number;
}>(pos: T, offset: GeneratedOffset): T;