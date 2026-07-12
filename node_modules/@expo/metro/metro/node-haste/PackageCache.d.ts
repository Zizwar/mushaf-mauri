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

import type { PackageJson } from "../../metro-resolver/types";
type GetClosestPackageFn = (absoluteFilePath: string) => null | undefined | {
  packageJsonPath: string;
  packageRelativePath: string;
};
export interface PackageForModule {
  readonly packageJson: PackageJson;
  readonly rootPath: string;
  readonly packageRelativePath: string;
}
export declare class PackageCache {
  constructor(options: {
    getClosestPackage: GetClosestPackageFn;
  });
  getPackage(filePath: string): {
    readonly rootPath: string;
    readonly packageJson: PackageJson;
  };
  getPackageForModule(absoluteModulePath: string): null | undefined | PackageForModule;
  invalidate(filePath: string): void;
}