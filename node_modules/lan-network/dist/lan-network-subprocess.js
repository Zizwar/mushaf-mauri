var s = require("./chunks/index-chunk.js");

!async function output() {
  const n = await s.lanNetwork({
    noProbe: process.argv.includes("--no-probe"),
    noDhcp: process.argv.includes("--no-dhcp")
  });
  process.stdout.write(JSON.stringify(n));
  process.exit(0);
}();
//# sourceMappingURL=lan-network-subprocess.js.map
