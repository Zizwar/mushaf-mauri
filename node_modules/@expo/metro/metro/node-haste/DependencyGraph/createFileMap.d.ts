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

import type { ConfigT } from "../../../metro-config";
import type { HasteMap } from "../../../metro-file-map";
import MetroFileMap, { DependencyPlugin } from "../../../metro-file-map";
declare function createFileMap(config: ConfigT, options?: {
  readonly extractDependencies?: boolean;
  readonly watch?: boolean;
  readonly throwOnModuleCollision?: boolean;
  readonly cacheFilePrefix?: string;
}): {
  fileMap: MetroFileMap;
  hasteMap: HasteMap;
  dependencyPlugin?: null | DependencyPlugin;
};
export default createFileMap;