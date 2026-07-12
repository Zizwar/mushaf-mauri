"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.Watcher = void 0;
var _node = _interopRequireDefault(require("./crawlers/node"));
var _watchman = _interopRequireDefault(require("./crawlers/watchman"));
var _common = require("./watchers/common");
var _FallbackWatcher = _interopRequireDefault(
  require("./watchers/FallbackWatcher"),
);
var _NativeWatcher = _interopRequireDefault(
  require("./watchers/NativeWatcher"),
);
var _WatchmanWatcher = _interopRequireDefault(
  require("./watchers/WatchmanWatcher"),
);
var _events = _interopRequireDefault(require("events"));
var fs = _interopRequireWildcard(require("fs"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var path = _interopRequireWildcard(require("path"));
var _perf_hooks = require("perf_hooks");
function _interopRequireWildcard(e, t) {
  if ("function" == typeof WeakMap)
    var r = new WeakMap(),
      n = new WeakMap();
  return (_interopRequireWildcard = function (e, t) {
    if (!t && e && e.__esModule) return e;
    var o,
      i,
      f = { __proto__: null, default: e };
    if (null === e || ("object" != typeof e && "function" != typeof e))
      return f;
    if ((o = t ? n : r)) {
      if (o.has(e)) return o.get(e);
      o.set(e, f);
    }
    for (const t in e)
      "default" !== t &&
        {}.hasOwnProperty.call(e, t) &&
        ((i =
          (o = Object.defineProperty) &&
          Object.getOwnPropertyDescriptor(e, t)) &&
        (i.get || i.set)
          ? o(f, t, i)
          : (f[t] = e[t]));
    return f;
  })(e, t);
}
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const debug = require("debug")("Metro:Watcher");
const MAX_WAIT_TIME = 240000;
let nextInstanceId = 0;
class Watcher extends _events.default {
  #activeWatcher;
  #backends = [];
  #instanceId;
  #nextHealthCheckId = 0;
  #options;
  #pendingHealthChecks = new Map();
  constructor(options) {
    super();
    this.#options = options;
    this.#instanceId = nextInstanceId++;
  }
  async crawl() {
    this.#options.perfLogger?.point("crawl_start");
    const options = this.#options;
    const result = await this.#crawl({
      previousState: options.previousState,
      roots: options.roots,
      useWatchman: options.useWatchman,
    });
    this.#options.perfLogger?.point("crawl_end");
    return result;
  }
  async recrawl(subpath, currentFileSystem) {
    return this.#crawl({
      previousState: {
        clocks: new Map(),
        fileSystem: currentFileSystem,
      },
      roots: [path.join(this.#options.rootDir, subpath)],
      subpath,
      useWatchman: false,
    });
  }
  async #crawl(crawlOptions) {
    const options = this.#options;
    const { useWatchman, subpath } = crawlOptions;
    const ignoreForCrawl = (filePath) =>
      options.ignoreForCrawl(filePath) ||
      path.basename(filePath).startsWith(this.#options.healthCheckFilePrefix);
    const crawl = useWatchman ? _watchman.default : _node.default;
    let crawler = crawl === _watchman.default ? "watchman" : "node";
    options.abortSignal.throwIfAborted();
    const crawlerOptions = {
      abortSignal: options.abortSignal,
      computeSha1: options.computeSha1,
      console: options.console,
      includeSymlinks: options.enableSymlinks,
      extensions: options.extensions,
      forceNodeFilesystemAPI: options.forceNodeFilesystemAPI,
      ignore: ignoreForCrawl,
      onStatus: (status) => {
        this.emit("status", status);
      },
      perfLogger: options.perfLogger,
      previousState: crawlOptions.previousState,
      rootDir: options.rootDir,
      roots: crawlOptions.roots,
      subpath,
    };
    debug("Crawling roots: %s with %s crawler.", crawlOptions.roots, crawler);
    let delta;
    try {
      delta = await crawl(crawlerOptions);
    } catch (firstError) {
      if (crawl !== _watchman.default) {
        throw firstError;
      }
      crawler = "node";
      options.console.warn(
        "metro-file-map: Watchman crawl failed. Retrying once with node " +
          "crawler.\n" +
          "  Usually this happens when watchman isn't running. Create an " +
          "empty `.watchmanconfig` file in your project's root folder or " +
          "initialize a git or hg repository in your project.\n" +
          "  " +
          firstError.toString(),
      );
      try {
        delta = await (0, _node.default)(crawlerOptions);
      } catch (retryError) {
        throw new Error(
          "Crawler retry failed:\n" +
            `  Original error: ${firstError.message}\n` +
            `  Retry error: ${retryError.message}\n`,
        );
      }
    }
    debug(
      'Crawler "%s" returned %d added/modified, %d removed, %d clock(s).',
      crawler,
      delta.changedFiles.size,
      delta.removedFiles.size,
      delta.clocks?.size ?? 0,
    );
    return delta;
  }
  async watch(onChange) {
    const { extensions, ignorePatternForWatch, useWatchman } = this.#options;
    const WatcherImpl = useWatchman
      ? _WatchmanWatcher.default
      : _NativeWatcher.default.isSupported()
        ? _NativeWatcher.default
        : _FallbackWatcher.default;
    let watcher = "fallback";
    if (WatcherImpl === _WatchmanWatcher.default) {
      watcher = "watchman";
    } else if (WatcherImpl === _NativeWatcher.default) {
      watcher = "native";
    }
    debug(`Using watcher: ${watcher}`);
    this.#options.perfLogger?.annotate({
      string: {
        watcher,
      },
    });
    this.#activeWatcher = watcher;
    const createWatcherBackend = (root) => {
      const watcherOptions = {
        dot: true,
        globs: [
          "**/package.json",
          "**/" + this.#options.healthCheckFilePrefix + "*",
          ...extensions.map((extension) => "**/*." + extension),
        ],
        ignored: ignorePatternForWatch,
        watchmanDeferStates: this.#options.watchmanDeferStates,
      };
      const watcher = new WatcherImpl(root, watcherOptions);
      return new Promise(async (resolve, reject) => {
        const rejectTimeout = setTimeout(
          () => reject(new Error("Failed to start watch mode.")),
          MAX_WAIT_TIME,
        );
        watcher.onFileEvent((change) => {
          const basename = path.basename(change.relativePath);
          if (basename.startsWith(this.#options.healthCheckFilePrefix)) {
            if (change.event === _common.TOUCH_EVENT) {
              debug(
                "Observed possible health check cookie: %s in %s",
                change.relativePath,
                root,
              );
              this.#handleHealthCheckObservation(basename);
            }
            return;
          }
          if (change.event === "recrawl" && useWatchman) {
            this.#options.console.error(
              "metro-file-map: Received unexpected recrawl event while using " +
                "Watchman. Watchman recrawls are not implemented.",
            );
            return;
          }
          onChange(change);
        });
        await watcher.startWatching();
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
    };
    this.#backends = await Promise.all(
      this.#options.roots.map(createWatcherBackend),
    );
  }
  #handleHealthCheckObservation(basename) {
    const resolveHealthCheck = this.#pendingHealthChecks.get(basename);
    if (!resolveHealthCheck) {
      return;
    }
    resolveHealthCheck();
  }
  async close() {
    await Promise.all(this.#backends.map((watcher) => watcher.stopWatching()));
    this.#activeWatcher = null;
  }
  async checkHealth(timeout) {
    const healthCheckId = this.#nextHealthCheckId++;
    if (healthCheckId === Number.MAX_SAFE_INTEGER) {
      this.#nextHealthCheckId = 0;
    }
    const watcher = this.#activeWatcher;
    const basename =
      this.#options.healthCheckFilePrefix +
      "-" +
      process.pid +
      "-" +
      this.#instanceId +
      "-" +
      healthCheckId;
    const healthCheckPath = path.join(this.#options.rootDir, basename);
    let result;
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(resolve, timeout),
    ).then(() => {
      if (!result) {
        result = {
          type: "timeout",
          pauseReason: this.#backends[0]?.getPauseReason(),
          timeout,
          watcher,
        };
      }
    });
    const startTime = _perf_hooks.performance.now();
    debug("Creating health check cookie: %s", healthCheckPath);
    const creationPromise = fs.promises
      .writeFile(healthCheckPath, String(startTime))
      .catch((error) => {
        if (!result) {
          result = {
            type: "error",
            error,
            timeout,
            watcher,
          };
        }
      });
    const observationPromise = new Promise((resolve) => {
      this.#pendingHealthChecks.set(basename, resolve);
    }).then(() => {
      if (!result) {
        result = {
          type: "success",
          timeElapsed: _perf_hooks.performance.now() - startTime,
          timeout,
          watcher,
        };
      }
    });
    await Promise.race([
      timeoutPromise,
      creationPromise.then(() => observationPromise),
    ]);
    this.#pendingHealthChecks.delete(basename);
    creationPromise.then(() =>
      fs.promises.unlink(healthCheckPath).catch(() => {}),
    );
    debug("Health check result: %o", result);
    return (0, _nullthrows.default)(result);
  }
}
exports.Watcher = Watcher;
