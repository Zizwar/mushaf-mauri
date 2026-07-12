/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<9cddf7f051187702952d6405d4589b15>>
 *
 * This file was translated from Flow by scripts/js-api/build-types/index.js.
 * Original file: packages/react-native/Libraries/Animated/nodes/AnimatedProps.js
 */

import * as React from "react";
import type { RootTag } from "../../Types/RootTagTypes";
import type { AnimatedNodeConfig } from "./AnimatedNode";
import type { AnimatedStyleAllowlist } from "./AnimatedStyle";
import AnimatedNode from "./AnimatedNode";
export type AnimatedPropsAllowlist = Readonly<{
  style?: AnimatedStyleAllowlist | undefined;
  [key: string]: true | AnimatedStyleAllowlist;
}>;
type TargetViewInstance = React.ComponentRef<React.ElementType>;
declare class AnimatedProps extends AnimatedNode {
  constructor(inputProps: {
    [$$Key$$: string]: unknown;
  }, callback: () => void, allowlist?: null | undefined | AnimatedPropsAllowlist, rootTag?: RootTag, config?: null | undefined | AnimatedNodeConfig);
  update(): void;
  setNativeView(instance: TargetViewInstance): void;
}
export default AnimatedProps;
