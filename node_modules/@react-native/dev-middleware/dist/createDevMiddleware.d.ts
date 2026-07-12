/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { CreateCustomMessageHandlerFn } from "./inspector-proxy/CustomMessageHandler";
import type { DevToolLauncher } from "./types/DevToolLauncher";
import type { EventReporter } from "./types/EventReporter";
import type { ExperimentsConfig } from "./types/Experiments";
import type { Logger } from "./types/Logger";
import type { ReadonlyURL } from "./types/ReadonlyURL";
import type { NextHandleFunction } from "connect";
type Options = Readonly<{
  /**
   * The base URL to the dev server, as reachable from the machine on which
   * dev-middleware is hosted. Typically `http://localhost:${metroPort}`.
   */
  serverBaseUrl: string | ReadonlyURL;
  /**
   * An implementation for logging messages to the terminal (recommended).
   *
   * In `@react-native/community-cli-plugin`, this reuses Metro's
   * 'unstable_server_log' event in `TerminalReporter`.
   */
  logger?: Logger;
  /**
   * An `EventReporter` implementation for logging structured events
   * (recommended).
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_eventReporter?: EventReporter;
  /**
   * The set of experimental features to enable.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_experiments?: ExperimentsConfig;
  /**
   * Override the default handlers for launching external applications (the
   * debugger frontend) on the host machine (or target dev machine).
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_toolLauncher?: DevToolLauncher;
  /**
   * Create custom handler to add support for unsupported CDP events, or debuggers.
   * This handler is instantiated per logical device and debugger pair.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_customInspectorMessageHandler?: CreateCustomMessageHandlerFn;
  /**
   * Whether to measure the event loop performance of inspector proxy and
   * report it via the event reporter.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_trackInspectorProxyEventLoopPerf?: boolean;
}>;
type DevMiddlewareAPI = Readonly<{
  middleware: NextHandleFunction;
  websocketEndpoints: { [path: string]: ws$WebSocketServer };
}>;
declare function createDevMiddleware($$PARAM_0$$: Options): DevMiddlewareAPI;
export default createDevMiddleware;
