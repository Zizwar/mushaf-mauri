/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b3b35ccf34137c8b1fafd02a35fcd5df>>
 *
 * This file was translated from Flow by scripts/js-api/build-types/index.js.
 * Original file: packages/react-native/Libraries/Animated/nodes/AnimatedInterpolation.js
 */

import type { NativeColorValue } from "../../StyleSheet/StyleSheetTypes";
import type AnimatedNode from "./AnimatedNode";
import type { AnimatedNodeConfig } from "./AnimatedNode";
import AnimatedWithChildren from "./AnimatedWithChildren";
type ExtrapolateType = "extend" | "identity" | "clamp";
export type InterpolationConfigSupportedOutputType = number | string | NativeColorValue;
export type InterpolationConfigType<OutputT extends InterpolationConfigSupportedOutputType> = Readonly<Omit<AnimatedNodeConfig, keyof {
  inputRange: ReadonlyArray<number>;
  outputRange: ReadonlyArray<OutputT>;
  easing?: (input: number) => number;
  extrapolate?: ExtrapolateType;
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
}> & {
  inputRange: ReadonlyArray<number>;
  outputRange: ReadonlyArray<OutputT>;
  easing?: (input: number) => number;
  extrapolate?: ExtrapolateType;
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
}>;
declare class AnimatedInterpolation<OutputT extends InterpolationConfigSupportedOutputType> extends AnimatedWithChildren {
  constructor(parent: AnimatedNode, config: InterpolationConfigType<OutputT>);
  interpolate<NewOutputT extends number | string>(config: InterpolationConfigType<NewOutputT>): AnimatedInterpolation<NewOutputT>;
}
export default AnimatedInterpolation;
