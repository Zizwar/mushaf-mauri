type TxtValue = string | number | boolean | null | undefined;

interface AdvertiseOptions {
  /** Instance/display name of the service */
  name: string;
  /** Service type without protocol (e.g. "http") */
  type: string;
  /** Protocol used by the service (typically "tcp" or "udp") */
  protocol: 'tcp' | 'udp' | (string & {});
  /** Hostname of device offering the service */
  hostname?: string;
  /** Port the service is listening on */
  port: number;
  /** List of subtypes for selective discovery */
  subtypes?: string[];
  /** Service metadata */
  txt?: Record<string, TxtValue>;
  /** TTL to apply to service records */
  ttl?: number;
  /** Set to "IPv4" or "IPv6" to run single stack rather than dual stack */
  stack?: 'IPv4' | 'IPv6' | null;
}
interface AdvertiserHandle {
  readonly promise: Promise<void>;
  close(): Promise<void>;
}
declare function advertise(options: AdvertiseOptions): () => Promise<void>;

export { advertise };
export type { AdvertiseOptions, AdvertiserHandle };
