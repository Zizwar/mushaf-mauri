"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.unstable_prepareDebuggerShell = unstable_prepareDebuggerShell;
exports.unstable_spawnDebuggerShellWithArgs =
  unstable_spawnDebuggerShellWithArgs;
var _LaunchUtils = require("./private/LaunchUtils");
const { spawn } = require("cross-spawn");
const debug = require("debug")("Metro:DebuggerShell");
const path = require("path");
const DEVTOOLS_BINARY_DOTSLASH_FILE = path.join(
  __dirname,
  "../../bin/react-native-devtools",
);
async function unstable_spawnDebuggerShellWithArgs(
  args,
  {
    mode = "detached",
    flavor = process.env.RNDT_DEV === "1" ? "dev" : "prebuilt",
    prebuiltBinaryPath,
    silent = process.env.NODE_ENV === "test",
  } = {},
) {
  const [binaryPath, baseArgs] = getShellBinaryAndArgs(
    flavor,
    prebuiltBinaryPath,
  );
  return new Promise((resolve, reject) => {
    const { ELECTRON_RUN_AS_NODE: _, ...env } = process.env;
    const child = spawn(binaryPath, [...baseArgs, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      detached: mode === "detached",
      env,
    });
    if (mode === "detached") {
      child.on("spawn", () => {
        debug("Debugger spawned in detached mode");
        resolve();
      });
      child.on("close", (code, signal) => {
        debug("Debugger closed with code %s and signal %s", code, signal);
        if (code !== 0) {
          if (!silent) {
            console.error(
              "Debugger exited with non-zero code (code: %s, signal: %s)",
              code,
              signal,
            );
          }
          reject(
            new Error(
              `Failed to open debugger shell: exited with code ${code}`,
            ),
          );
        }
      });
      child.on("error", (error) => {
        debug("Debugger shell encountered error: %s", error);
        reject(error);
      });
      if (!silent) {
        child.stdout.on("data", (data) =>
          console.log("[debugger-shell stdout] " + String(data)),
        );
        child.stderr.on("data", (data) =>
          console.warn("[debugger-shell stderr] " + String(data)),
        );
      }
      child.unref();
    } else if (mode === "syncThenExit") {
      child.on("close", function (code, signal) {
        debug("Debugger exited with code %s and signal %s", code, signal);
        if (code == null && !silent) {
          console.error(
            "Debugger exited with code %s and signal %s",
            code,
            signal,
          );
          process.exit(1);
        }
        process.exit(code);
      });
      const handleTerminationSignal = function (signal) {
        process.on(signal, function signalHandler() {
          debug("Received signal %s. Killing debugger shell.", signal);
          if (!child.killed) {
            child.kill(signal);
          }
        });
      };
      handleTerminationSignal("SIGINT");
      handleTerminationSignal("SIGTERM");
    }
  });
}
async function unstable_prepareDebuggerShell({
  prebuiltBinaryPath,
  flavor = process.env.RNDT_DEV === "1" ? "dev" : "prebuilt",
} = {}) {
  try {
    switch (flavor) {
      case "prebuilt":
        const prebuiltResult = await (0,
        _LaunchUtils.prepareDebuggerShellFromDotSlashFile)(
          prebuiltBinaryPath ?? DEVTOOLS_BINARY_DOTSLASH_FILE,
        );
        if (prebuiltResult.code !== "success") {
          return prebuiltResult;
        }
        break;
      case "dev":
        break;
      default:
        throw new Error(`Unknown flavor: ${flavor}`);
    }
    const [binaryPath, baseArgs] = getShellBinaryAndArgs(
      flavor,
      prebuiltBinaryPath,
    );
    const { code, stderr } = await (0, _LaunchUtils.spawnAndGetStderr)(
      binaryPath,
      [...baseArgs, "--version"],
    );
    if (code !== 0) {
      return {
        code: "unexpected_error",
        verboseInfo: stderr,
      };
    }
    return {
      code: "success",
    };
  } catch (e) {
    return {
      code: "unexpected_error",
      verboseInfo: e.message,
    };
  }
}
function getShellBinaryAndArgs(flavor, prebuiltBinaryPath) {
  switch (flavor) {
    case "prebuilt":
      return [
        require("fb-dotslash"),
        [prebuiltBinaryPath ?? DEVTOOLS_BINARY_DOTSLASH_FILE],
      ];
    case "dev":
      return [require("electron"), [require.resolve("../electron")]];
    default:
      throw new Error(`Unknown flavor: ${flavor}`);
  }
}
