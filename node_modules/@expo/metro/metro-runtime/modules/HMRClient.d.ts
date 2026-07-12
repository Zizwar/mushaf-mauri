import type { HmrUpdate } from "./types";
import EventEmitter from "./vendor/eventemitter3";
export declare const enum _SocketState {
  opening = "opening",
  open = "open",
  closed = "closed",
}
export type SocketState = `${_SocketState}`;
declare class HMRClient extends EventEmitter {
  _isEnabled: boolean;
  _pendingUpdate: HmrUpdate | null;
  _queue: Array<string>;
  _state: SocketState;
  _ws: WebSocket;
  _heartbeatTimer: null | undefined | NodeJS.Timeout;
  constructor(url: string);
  close(): void;
  send(message: string): void;
  _flushQueue(): void;
  _startHeartbeat(): void;
  _stopHeartbeat(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  hasPendingUpdates(): boolean;
}
export default HMRClient;