import type { WatchmanQuery, WatchmanQuerySince } from "fb-watchman";
export declare function planQuery($$PARAM_0$$: {
  readonly since?: null | WatchmanQuerySince;
  readonly directoryFilters: ReadonlyArray<string>;
  readonly extensions: ReadonlyArray<string>;
  readonly includeSha1: boolean;
  readonly includeSymlinks: boolean;
}): {
  query: WatchmanQuery;
  queryGenerator: string;
};