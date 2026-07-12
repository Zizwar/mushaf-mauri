/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { Experiments } from "../types/Experiments";
import type { ReadonlyURL } from "../types/ReadonlyURL";
/**
 * Get the DevTools frontend URL to debug a given React Native CDP target.
 */
declare function getDevToolsFrontendUrl(
  experiments: Experiments,
  webSocketDebuggerUrl: string,
  devServerUrl: ReadonlyURL,
  options?: Readonly<{
    relative?: boolean;
    launchId?: string;
    telemetryInfo?: string;
    appId?: string;
    panel?: string;
  }>,
): string;
export default getDevToolsFrontendUrl;
