/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<31638ab56a46d6a56a8501eca5d0a86e>>
 *
 * This file was translated from Flow by scripts/js-api/build-types/index.js.
 * Original file: packages/react-native/Libraries/Text/Text.js
 */

import type { TextProps } from "./TextProps";
import { NativeSelectableText, NativeText, NativeVirtualText } from "./TextNativeComponent";
import * as React from "react";
export type { TextProps } from "./TextProps";
type TextForwardRef = React.ComponentRef<typeof NativeText | typeof NativeVirtualText | typeof NativeSelectableText>;
declare const TextImpl: (props: Omit<TextProps, keyof {
  ref?: React.Ref<TextForwardRef>;
}> & {
  ref?: React.Ref<TextForwardRef>;
}) => React.ReactNode;
/**
 * Text is the fundamental component for displaying text.
 *
 * @see https://reactnative.dev/docs/text
 */
declare const $$Text: typeof TextImpl;
declare type $$Text = typeof $$Text;
export default $$Text;
