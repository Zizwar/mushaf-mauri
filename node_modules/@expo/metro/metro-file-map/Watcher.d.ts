/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { Console, CrawlerOptions, CrawlResult, PerfLogger, WatcherBackendChangeEvent } from "./flow-types";
import EventEmitter from "node:events";
export interface WatcherOptions {
  abortSignal: AbortSignal;
  computeSha1: boolean;
  console: Console;
  enableSymlinks: boolean;
  extensions: ReadonlyArray<string>;
  forceNodeFilesystemAPI: boolean;
  healthCheckFilePrefix: string;
  ignoreForCrawl: (filePath: string) => boolean;
  ignorePatternForWatch: RegExp;
  previousState: CrawlerOptions["previousState"];
  perfLogger?: null | PerfLogger;
  roots: ReadonlyArray<string>;
  rootDir: string;
  useWatchman: boolean;
  watch: boolean;
  watchmanDeferStates: ReadonlyArray<string>;
}
export type HealthCheckResult = {
  type: "error";
  timeout: number;
  error: Error;
  watcher?: null | string;
} | {
  type: "success";
  timeout: number;
  timeElapsed: number;
  watcher?: null | string;
} | {
  type: "timeout";
  timeout: number;
  watcher?: null | string;
  pauseReason?: null | string;
};
export declare class Watcher extends EventEmitter {
  constructor(options: WatcherOptions);
  crawl(): Promise<CrawlResult>;
  recrawl(subpath: string, currentFileSystem: CrawlerOptions["previousState"]["fileSystem"]): Promise<CrawlResult>;
  watch(onChange: (change: WatcherBackendChangeEvent) => void): Promise<void>;
  close(): Promise<void>;
  checkHealth(timeout: number): Promise<HealthCheckResult>;
}