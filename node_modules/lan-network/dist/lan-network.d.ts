interface NetworkAssignment {
  iname: string;
  address: string;
  netmask: string;
  mac: string;
  internal: boolean;
  cidr: string | null;
  family: 'IPv4';
}
interface GatewayAssignment extends NetworkAssignment {
  gateway: string | null;
}

interface NetworkOptions {
  noProbe?: boolean;
  noDhcp?: boolean;
}
declare function lanNetwork(opts?: NetworkOptions): Promise<GatewayAssignment>;
declare function lanNetworkSync(opts?: NetworkOptions): GatewayAssignment;

export { type NetworkOptions, lanNetwork, lanNetworkSync };
