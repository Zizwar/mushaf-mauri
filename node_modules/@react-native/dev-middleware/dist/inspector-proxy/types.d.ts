/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

/**
 * A capability flag disables a specific feature/hack in the InspectorProxy
 * layer by indicating that the target supports one or more modern CDP features.
 */
export type TargetCapabilityFlags = Readonly<{
  /**
   * The target supports a stable page representation across reloads.
   *
   * In the proxy, this disables legacy page reload emulation and the
   * additional 'React Native Experimental' target in `/json/list`.
   *
   * In the launch flow, this allows targets to be matched directly by
   * `logicalDeviceId`.
   */
  nativePageReloads?: boolean;
  /**
   * The target supports fetching source code and source maps.
   *
   * In the proxy, this disables source fetching emulation and host rewrites.
   */
  nativeSourceCodeFetching?: boolean;
  /**
   * The target supports multiple concurrent debugger connections.
   *
   * When true, the proxy allows multiple debuggers to connect to the same
   * page simultaneously, each identified by a unique session ID.
   * When false (default/legacy), connecting a new debugger disconnects
   * any existing debugger connection to that page.
   */
  supportsMultipleDebuggers?: boolean;
}>;
export type PageFromDevice = Readonly<{
  id: string;
  title: string;
  /** Sent from modern targets only */
  description?: string;
  /** @deprecated This is sent from legacy targets only */
  vm?: string;
  app: string;
  capabilities?: TargetCapabilityFlags;
}>;
export type Page = Readonly<
  Omit<
    PageFromDevice,
    keyof { capabilities: NonNullable<PageFromDevice["capabilities"]> }
  > & { capabilities: NonNullable<PageFromDevice["capabilities"]> }
>;
export type WrappedEventFromDevice = Readonly<{
  event: "wrappedEvent";
  payload: Readonly<{
    pageId: string;
    wrappedEvent: string;
    sessionId?: string;
  }>;
}>;
export type WrappedEventToDevice = Readonly<{
  event: "wrappedEvent";
  payload: Readonly<{
    pageId: string;
    wrappedEvent: string;
    sessionId: string;
  }>;
}>;
export type ConnectRequest = Readonly<{
  event: "connect";
  payload: Readonly<{ pageId: string; sessionId: string }>;
}>;
export type DisconnectRequest = Readonly<{
  event: "disconnect";
  payload: Readonly<{ pageId: string; sessionId: string }>;
}>;
export type GetPagesRequest = { event: "getPages" };
export type GetPagesResponse = {
  event: "getPages";
  payload: ReadonlyArray<PageFromDevice>;
};
export type MessageFromDevice =
  | GetPagesResponse
  | WrappedEventFromDevice
  | DisconnectRequest;
export type MessageToDevice =
  | GetPagesRequest
  | WrappedEventToDevice
  | ConnectRequest
  | DisconnectRequest;
export type PageDescription = Readonly<{
  id: string;
  title: string;
  appId: string;
  description: string;
  type: string;
  devtoolsFrontendUrl: string;
  webSocketDebuggerUrl: string;
  /** @deprecated Prefer `title` */
  deviceName: string;
  /** @deprecated This is sent from legacy targets only */
  vm?: string;
  reactNative: Readonly<{
    logicalDeviceId: string;
    capabilities: Page["capabilities"];
  }>;
}>;
export type JsonPagesListResponse = Array<PageDescription>;
export type JsonVersionResponse = Readonly<{
  Browser: string;
  "Protocol-Version": string;
}>;
export type JSONSerializable =
  | boolean
  | number
  | string
  | null
  | ReadonlyArray<JSONSerializable>
  | { readonly [$$Key$$: string]: JSONSerializable };
export type DeepReadOnly<T> =
  T extends ReadonlyArray<infer V>
    ? ReadonlyArray<DeepReadOnly<V>>
    : T extends {}
      ? { readonly [K in keyof T]: DeepReadOnly<T[K]> }
      : T;
