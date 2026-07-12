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

import type { ReadonlySourceLocation } from "../../shared/types";
import type { PluginObj } from "@babel/core";
import * as Types from "@babel/types";
import type { MetroBabelFileMetadata } from "../../../metro-babel-transformer";
type ImportDeclarationLocs = Set<string>;
export interface _State_file {
  metadata?: MetroBabelFileMetadata;
}
export interface State {
  importDeclarationLocs: ImportDeclarationLocs;
  file: _State_file;
}
declare function importLocationsPlugin($$PARAM_0$$: {
  types: typeof Types;
}): PluginObj<State>;
declare function locToKey(loc: ReadonlySourceLocation): string;
export { importLocationsPlugin, locToKey };