/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

import type { FileMapPlugin, FileMapPluginInitOptions, FileMapPluginWorker, MockMap as IMockMap, Path, RawMockMap, ReadonlyFileSystemChanges } from "../flow-types";
export declare const CACHE_VERSION: 2;
export interface MockMapOptions {
  readonly console: typeof console;
  readonly mocksPattern: RegExp;
  readonly rawMockMap?: RawMockMap;
  readonly rootDir: Path;
  readonly throwOnModuleCollision: boolean;
}
declare class MockPlugin implements FileMapPlugin<RawMockMap, void>, IMockMap {
  readonly name: "mocks";
  constructor($$PARAM_0$$: MockMapOptions);
  initialize($$PARAM_0$$: FileMapPluginInitOptions<RawMockMap>): Promise<void>;
  getMockModule(name: string): null | undefined | Path;
  onChanged(delta: ReadonlyFileSystemChanges<null | undefined | void>): void;
  getSerializableSnapshot(): RawMockMap;
  assertValid(): void;
  getCacheKey(): string;
  getWorker(): null | undefined | FileMapPluginWorker;
}
export default MockPlugin;