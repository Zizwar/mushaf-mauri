interface NetworkBinding {
  readonly iname: string;
  readonly family: IPType;
  readonly address: string;
  readonly netmask: string;
  readonly mac: string;
  readonly internal: boolean;
  readonly cidr: string | null;
  readonly scopeid?: number;
}

type TxtValue = string | number | boolean | null | undefined;

declare enum IPType {
  v4 = 'IPv4',
  v6 = 'IPv6',
}

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
  /** Optional handler for non-fatal errors (silent by default) */
  onError?: (error: unknown) => void;
}
interface AdvertiserHandle {
  readonly promise: Promise<void>;
  readonly settled: boolean;
  readonly bindings: NetworkBinding[];
  close(): Promise<void>;
}
declare function advertise(options: AdvertiseOptions): () => Promise<void>;

export { advertise };
export type { AdvertiseOptions, AdvertiserHandle };
