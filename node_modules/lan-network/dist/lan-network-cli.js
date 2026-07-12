#!/usr/bin/env node
var e = require("./chunks/index-chunk.js");

!function cli() {
  let t = "default";
  e: for (let e = 1; e < process.argv.length; e++) {
    const o = process.argv[e].trim().toLowerCase();
    switch (o) {
     case "-h":
     case "--help":
      t = "help";
      break e;

     case "-d":
     case "--dhcp":
      t = "dhcp";
      break;

     case "-p":
     case "--probe":
      t = "probe";
      break;

     case "-f":
     case "--fallback":
      t = "fallback";
      break;

     default:
      if (o.startsWith("-")) {
        throw new TypeError(`Invalid flag: ${o}`);
      }
    }
  }
  switch (t) {
   case "help":
    return function help() {
      const e = [ "Discover the machine's default gateway and local network IP (test utility)", "", "Usage", "  $ lan-network", "  $ lan-network --default", "", "Modes", "  --probe     Discover gateway via UDP4 socket to publicly routed address", "  --dhcp      Discover gateway via DHCPv4 discover broadcast", "  --fallback  Return highest-priority IPv4 network interface assignment", "  --default   Try the three above modes in order", "  --help      Print help output" ].join("\n");
      console.log(e);
    }();

   case "dhcp":
    return async function dhcp() {
      const t = e.interfaceAssignments();
      if (!t.length) {
        console.error("No available network interface assignments");
        process.exit(1);
      }
      const o = await Promise.allSettled(t.map((t => e.dhcpDiscover(t))));
      let s = null;
      for (const r of o) {
        if ("fulfilled" === r.status && r.value) {
          if (s = e.matchAssignment(t, r.value)) {
            break;
          }
        }
      }
      if (s && s !== e.DEFAULT_ASSIGNMENT) {
        console.log(JSON.stringify(s, null, 2));
        process.exit(0);
      } else {
        console.error("No DHCP router was discoverable");
        process.exit(1);
      }
    }();

   case "probe":
    return async function probe() {
      const t = e.interfaceAssignments();
      if (!t.length) {
        console.error("No available network interface assignments");
        process.exit(1);
      }
      try {
        const o = await e.probeDefaultRoute();
        const s = e.matchAssignment(t, o);
        if (s && s !== e.DEFAULT_ASSIGNMENT) {
          console.log(JSON.stringify(s, null, 2));
          process.exit(0);
        } else {
          console.error("No default gateway or route");
          process.exit(1);
        }
      } catch (e) {
        console.error("No default gateway or route");
        console.error(e);
        process.exit(1);
      }
    }();

   case "fallback":
    return async function fallback() {
      const t = e.interfaceAssignments();
      if (!t.length) {
        console.error("No available network interface assignments");
        process.exit(1);
      }
      const o = {
        ...t[0],
        gateway: null
      };
      console.log(JSON.stringify(o, null, 2));
      process.exit(0);
    }();

   case "default":
    (async function main() {
      const t = await e.lanNetwork();
      if (t !== e.DEFAULT_ASSIGNMENT) {
        console.log(JSON.stringify(t, null, 2));
        process.exit(0);
      } else {
        console.error("No default gateway, route, or DHCP router");
        process.exit(1);
      }
    })();
  }
}();
//# sourceMappingURL=lan-network-cli.js.map
