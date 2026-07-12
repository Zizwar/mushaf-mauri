/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { DebuggerShellPreparationResult } from "./DevToolLauncher";
type SuccessResult<Props extends {} | void = {}> =
  /**
   * > 15 |   ...Props,
   *      |   ^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any;
type ErrorResult<ErrorT = unknown, Props extends {} | void = {}> =
  /**
   * > 21 |   ...Props,
   *      |   ^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any;
type CodedErrorResult<ErrorCode extends string> = {
  status: "coded_error";
  errorCode: ErrorCode;
  errorDetails?: string;
};
export type DebuggerSessionIDs = {
  appId: string | null;
  deviceName: string | null;
  deviceId: string | null;
  pageId: string | null;
};
export type ConnectionUptime = { connectionUptime: number };
export type ReportableEvent =
  | /**
   * > 45 |       ...
   *      |       ^^^
   * > 46 |         | SuccessResult<{
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 47 |             targetDescription: string,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 48 |             ...DebuggerSessionIDs,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 49 |           }>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 50 |         | ErrorResult<unknown>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 51 |         | CodedErrorResult<"NO_APPS_FOUND">,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 55 |       ...
   *      |       ^^^
   * > 56 |         | SuccessResult<{
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 57 |             ...DebuggerSessionIDs,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 58 |             frontendUserAgent: string | null,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 59 |           }>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 60 |         | ErrorResult<unknown, DebuggerSessionIDs>,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 70 |       ...DebuggerSessionIDs,
   *      |       ^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 86 |       ...DebuggerSessionIDs,
   *      |       ^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 90 |       ...DebuggerSessionIDs,
   *      |       ^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 99 |       ...ConnectionUptime,
   *      |       ^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 106 |       ...ConnectionUptime,
   *       |       ^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 113 |       ...ConnectionUptime,
   *       |       ^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 121 |       ...ConnectionUptime,
   *       |       ^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 129 |       ...ConnectionUptime,
   *       |       ^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | {
      type: "fusebox_shell_preparation_attempt";
      result: DebuggerShellPreparationResult;
    };
/**
 * A simple interface for logging events, to be implemented by integrators of
 * `dev-middleware`.
 *
 * This is an unstable API with no semver guarantees.
 */
export interface EventReporter {
  logEvent(event: ReportableEvent): void;
}
