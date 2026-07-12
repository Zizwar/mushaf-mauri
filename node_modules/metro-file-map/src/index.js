"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
Object.defineProperty(exports, "DependencyPlugin", {
  enumerable: true,
  get: function () {
    return _DependencyPlugin.default;
  },
});
Object.defineProperty(exports, "DiskCacheManager", {
  enumerable: true,
  get: function () {
    return _DiskCacheManager.DiskCacheManager;
  },
});
Object.defineProperty(exports, "DuplicateHasteCandidatesError", {
  enumerable: true,
  get: function () {
    return _DuplicateHasteCandidatesError.DuplicateHasteCandidatesError;
  },
});
Object.defineProperty(exports, "HasteConflictsError", {
  enumerable: true,
  get: function () {
    return _HasteConflictsError.HasteConflictsError;
  },
});
Object.defineProperty(exports, "HastePlugin", {
  enumerable: true,
  get: function () {
    return _HastePlugin.default;
  },
});
exports.default = void 0;
var _DiskCacheManager = require("./cache/DiskCacheManager");
var _constants = _interopRequireDefault(require("./constants"));
var _checkWatchmanCapabilities = _interopRequireDefault(
  require("./lib/checkWatchmanCapabilities"),
);
var _FileProcessor = require("./lib/FileProcessor");
var _FileSystemChangeAggregator = require("./lib/FileSystemChangeAggregator");
var _normalizePathSeparatorsToPosix = _interopRequireDefault(
  require("./lib/normalizePathSeparatorsToPosix"),
);
var _normalizePathSeparatorsToSystem = _interopRequireDefault(
  require("./lib/normalizePathSeparatorsToSystem"),
);
var _RootPathUtils = require("./lib/RootPathUtils");
var _TreeFS = _interopRequireDefault(require("./lib/TreeFS"));
var _Watcher = require("./Watcher");
var _events = _interopRequireDefault(require("events"));
var _fs = require("fs");
var _invariant = _interopRequireDefault(require("invariant"));
var path = _interopRequireWildcard(require("path"));
var _perf_hooks = require("perf_hooks");
var _DependencyPlugin = _interopRequireDefault(
  require("./plugins/DependencyPlugin"),
);
var _DuplicateHasteCandidatesError = require("./plugins/haste/DuplicateHasteCandidatesError");
var _HasteConflictsError = require("./plugins/haste/HasteConflictsError");
var _HastePlugin = _interopRequireDefault(require("./plugins/HastePlugin"));
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
const debug = require("debug")("Metro:FileMap");
const CACHE_BREAKER = "11";
const CHANGE_INTERVAL = 30;
const NODE_MODULES = path.sep + "node_modules" + path.sep;
const VCS_DIRECTORIES = /[/\\]\.(git|hg)[/\\]/.source;
const WATCHMAN_REQUIRED_CAPABILITIES = [
  "field-content.sha1hex",
  "relative_root",
  "suffix-set",
  "wildmatch",
];
class FileMap extends _events.default {
  #buildPromise;
  #cacheManager;
  #canUseWatchmanPromise;
  #changeID;
  #changeInterval;
  #console;
  #crawlerAbortController;
  #fileProcessor;
  #healthCheckInterval;
  #options;
  #pathUtils;
  #plugins;
  #startupPerfLogger;
  #watcher;
  static create(options) {
    return new FileMap(options);
  }
  constructor(options) {
    super();
    if (options.perfLoggerFactory) {
      this.#startupPerfLogger =
        options.perfLoggerFactory?.("START_UP").subSpan("fileMap") ?? null;
      this.#startupPerfLogger?.point("constructor_start");
    }
    let ignorePattern;
    if (options.ignorePattern) {
      const inputIgnorePattern = options.ignorePattern;
      if (inputIgnorePattern instanceof RegExp) {
        ignorePattern = new RegExp(
          inputIgnorePattern.source.concat("|" + VCS_DIRECTORIES),
          inputIgnorePattern.flags,
        );
      } else {
        throw new Error(
          "metro-file-map: the `ignorePattern` option must be a RegExp",
        );
      }
    } else {
      ignorePattern = new RegExp(VCS_DIRECTORIES);
    }
    this.#console = options.console || global.console;
    let dataSlot = _constants.default.PLUGINDATA;
    const indexedPlugins = [];
    const pluginWorkers = [];
    const plugins = options.plugins ?? [];
    for (const plugin of plugins) {
      const maybeWorker = plugin.getWorker();
      indexedPlugins.push({
        plugin,
        dataIdx: maybeWorker != null ? dataSlot++ : null,
      });
      if (maybeWorker != null) {
        pluginWorkers.push(maybeWorker);
      }
    }
    this.#plugins = indexedPlugins;
    const buildParameters = {
      cacheBreaker: CACHE_BREAKER,
      computeSha1: options.computeSha1 || false,
      enableSymlinks: options.enableSymlinks || false,
      extensions: options.extensions,
      forceNodeFilesystemAPI: !!options.forceNodeFilesystemAPI,
      ignorePattern,
      plugins,
      retainAllFiles: options.retainAllFiles,
      rootDir: options.rootDir,
      roots: Array.from(new Set(options.roots)),
    };
    this.#options = {
      ...buildParameters,
      healthCheck: options.healthCheck,
      perfLoggerFactory: options.perfLoggerFactory,
      resetCache: options.resetCache,
      useWatchman: options.useWatchman == null ? true : options.useWatchman,
      watch: !!options.watch,
      watchmanDeferStates: options.watchmanDeferStates ?? [],
    };
    const cacheFactoryOptions = {
      buildParameters,
    };
    this.#cacheManager = options.cacheManagerFactory
      ? options.cacheManagerFactory.call(null, cacheFactoryOptions)
      : new _DiskCacheManager.DiskCacheManager(cacheFactoryOptions, {});
    this.#fileProcessor = new _FileProcessor.FileProcessor({
      maxFilesPerWorker: options.maxFilesPerWorker,
      maxWorkers: options.maxWorkers,
      perfLogger: this.#startupPerfLogger,
      pluginWorkers,
      rootDir: options.rootDir,
    });
    this.#buildPromise = null;
    this.#pathUtils = new _RootPathUtils.RootPathUtils(options.rootDir);
    this.#startupPerfLogger?.point("constructor_end");
    this.#crawlerAbortController = new AbortController();
    this.#changeID = 0;
  }
  build() {
    this.#startupPerfLogger?.point("build_start");
    if (!this.#buildPromise) {
      this.#buildPromise = (async () => {
        let initialData;
        if (this.#options.resetCache !== true) {
          initialData = await this.read();
        }
        if (!initialData) {
          debug("Not using a cache");
        } else {
          debug("Cache loaded (%d clock(s))", initialData.clocks.size);
        }
        const rootDir = this.#options.rootDir;
        this.#startupPerfLogger?.point("constructFileSystem_start");
        const processFile = (normalPath, metadata, opts) => {
          const result = this.#fileProcessor.processRegularFile(
            normalPath,
            metadata,
            {
              computeSha1: opts.computeSha1,
              maybeReturnContent: true,
            },
          );
          debug("Lazily processed file: %s", normalPath);
          this.emit("metadata");
          return result?.content;
        };
        const fileSystem =
          initialData != null
            ? _TreeFS.default.fromDeserializedSnapshot({
                fileSystemData: initialData.fileSystemData,
                processFile,
                rootDir,
              })
            : new _TreeFS.default({
                processFile,
                rootDir,
              });
        this.#startupPerfLogger?.point("constructFileSystem_end");
        const plugins = this.#plugins;
        const [fileDelta] = await Promise.all([
          this.#buildFileDelta({
            clocks: initialData?.clocks ?? new Map(),
            fileSystem,
          }),
          Promise.all(
            plugins.map(({ plugin, dataIdx }) =>
              plugin.initialize({
                files: {
                  lookup: (mixedPath) => {
                    const result = fileSystem.lookup(mixedPath);
                    if (!result.exists) {
                      return {
                        exists: false,
                      };
                    }
                    if (result.type === "d") {
                      return {
                        exists: true,
                        type: "d",
                      };
                    }
                    return {
                      exists: true,
                      type: "f",
                      pluginData:
                        dataIdx != null ? result.metadata[dataIdx] : null,
                    };
                  },
                  fileIterator: (opts) =>
                    mapIterable(
                      fileSystem.metadataIterator(opts),
                      ({ baseName, canonicalPath, metadata }) => ({
                        baseName,
                        canonicalPath,
                        pluginData: dataIdx != null ? metadata[dataIdx] : null,
                      }),
                    ),
                },
                pluginState: initialData?.plugins.get(plugin.name),
              }),
            ),
          ),
        ]);
        const actualChanges = await this.#applyFileDelta(
          fileSystem,
          plugins,
          fileDelta,
        );
        const changeSize = actualChanges.getSize();
        plugins.forEach(({ plugin }) => plugin.assertValid());
        const watchmanClocks = new Map(fileDelta.clocks ?? []);
        await this.#takeSnapshotAndPersist(
          fileSystem,
          watchmanClocks,
          plugins,
          changeSize > 0,
        );
        debug("Finished mapping files (%d changes).", changeSize);
        await this.#watch(fileSystem, watchmanClocks, plugins);
        return {
          fileSystem,
        };
      })();
    }
    return this.#buildPromise.then((result) => {
      this.#startupPerfLogger?.point("build_end");
      return result;
    });
  }
  async read() {
    let data;
    this.#startupPerfLogger?.point("read_start");
    try {
      data = await this.#cacheManager.read();
    } catch (e) {
      this.#console.warn(
        "Error while reading cache, falling back to a full crawl:\n",
        e,
      );
      this.#startupPerfLogger?.annotate({
        string: {
          cacheReadError: e.toString(),
        },
      });
    }
    this.#startupPerfLogger?.point("read_end");
    return data;
  }
  async #buildFileDelta(previousState) {
    this.#startupPerfLogger?.point("buildFileDelta_start");
    const {
      computeSha1,
      enableSymlinks,
      extensions,
      forceNodeFilesystemAPI,
      ignorePattern,
      retainAllFiles,
      roots,
      rootDir,
      watch,
      watchmanDeferStates,
    } = this.#options;
    this.#watcher = new _Watcher.Watcher({
      abortSignal: this.#crawlerAbortController.signal,
      computeSha1,
      console: this.#console,
      enableSymlinks,
      extensions,
      forceNodeFilesystemAPI,
      healthCheckFilePrefix: this.#options.healthCheck.filePrefix,
      ignoreForCrawl: (filePath) => {
        const ignoreMatched = ignorePattern.test(filePath);
        return (
          ignoreMatched || (!retainAllFiles && filePath.includes(NODE_MODULES))
        );
      },
      ignorePatternForWatch: ignorePattern,
      perfLogger: this.#startupPerfLogger,
      previousState,
      rootDir,
      roots,
      useWatchman: await this.#shouldUseWatchman(),
      watch,
      watchmanDeferStates,
    });
    const watcher = this.#watcher;
    watcher.on("status", (status) => this.emit("status", status));
    const result = await watcher.crawl();
    this.#startupPerfLogger?.point("buildFileDelta_end");
    return result;
  }
  #maybeReadLink(normalPath, fileMetadata) {
    if (fileMetadata[_constants.default.SYMLINK] === 1) {
      return _fs.promises
        .readlink(this.#pathUtils.normalToAbsolute(normalPath))
        .then((symlinkTarget) => {
          fileMetadata[_constants.default.VISITED] = 1;
          fileMetadata[_constants.default.SYMLINK] = symlinkTarget;
        });
    }
    return null;
  }
  async #applyFileDelta(fileSystem, plugins, delta) {
    this.#startupPerfLogger?.point("applyFileDelta_start");
    const { changedFiles, removedFiles } = delta;
    this.#startupPerfLogger?.point("applyFileDelta_preprocess_start");
    this.#startupPerfLogger?.point("applyFileDelta_remove_start");
    const changeAggregator =
      new _FileSystemChangeAggregator.FileSystemChangeAggregator();
    for (const relativeFilePath of removedFiles) {
      fileSystem.remove(relativeFilePath, changeAggregator);
    }
    this.#startupPerfLogger?.point("applyFileDelta_remove_end");
    const readLinkPromises = [];
    const readLinkErrors = [];
    const filesToProcess = [];
    for (const [normalFilePath, fileData] of changedFiles) {
      if (fileData[_constants.default.VISITED] === 1) {
        continue;
      }
      if (fileData[_constants.default.SYMLINK] === 0) {
        filesToProcess.push([normalFilePath, fileData]);
      } else {
        const maybeReadLink = this.#maybeReadLink(normalFilePath, fileData);
        if (maybeReadLink) {
          readLinkPromises.push(
            maybeReadLink.catch((error) => {
              readLinkErrors.push({
                normalFilePath,
                error,
              });
            }),
          );
        }
      }
    }
    this.#startupPerfLogger?.point("applyFileDelta_preprocess_end");
    debug(
      "Found %d added/modified files and %d symlinks.",
      filesToProcess.length,
      readLinkPromises.length,
    );
    this.#startupPerfLogger?.point("applyFileDelta_process_start");
    const [batchResult] = await Promise.all([
      this.#fileProcessor.processBatch(filesToProcess, {
        computeSha1: this.#options.computeSha1,
        maybeReturnContent: false,
      }),
      Promise.all(readLinkPromises),
    ]);
    this.#startupPerfLogger?.point("applyFileDelta_process_end");
    this.#startupPerfLogger?.point("applyFileDelta_missing_start");
    for (const { normalFilePath, error } of batchResult.errors.concat(
      readLinkErrors,
    )) {
      if (["ENOENT", "EACCESS"].includes(error.code)) {
        delta.changedFiles.delete(normalFilePath);
        fileSystem.remove(normalFilePath, changeAggregator);
      } else {
        throw error;
      }
    }
    this.#startupPerfLogger?.point("applyFileDelta_missing_end");
    this.#startupPerfLogger?.point("applyFileDelta_add_start");
    fileSystem.bulkAddOrModify(changedFiles, changeAggregator);
    this.#startupPerfLogger?.point("applyFileDelta_add_end");
    this.#startupPerfLogger?.point("applyFileDelta_updatePlugins_start");
    this.#plugins.forEach(({ plugin, dataIdx }) => {
      plugin.onChanged(
        changeAggregator.getMappedView(
          dataIdx != null ? (metadata) => metadata[dataIdx] : () => null,
        ),
      );
    });
    this.#startupPerfLogger?.point("applyFileDelta_updatePlugins_end");
    this.#startupPerfLogger?.point("applyFileDelta_end");
    return changeAggregator;
  }
  async #takeSnapshotAndPersist(
    fileSystem,
    clocks,
    plugins,
    changedSinceCacheRead,
  ) {
    this.#startupPerfLogger?.point("persist_start");
    await this.#cacheManager.write(
      () => ({
        clocks: new Map(clocks),
        fileSystemData: fileSystem.getSerializableSnapshot(),
        plugins: new Map(
          plugins.map(({ plugin }) => [
            plugin.name,
            plugin.getSerializableSnapshot(),
          ]),
        ),
      }),
      {
        changedSinceCacheRead,
        eventSource: {
          onChange: (cb) => {
            this.on("change", cb);
            this.on("metadata", cb);
            return () => {
              this.removeListener("change", cb);
              this.removeListener("metadata", cb);
            };
          },
        },
        onWriteError: (error) => {
          this.#console.warn("[metro-file-map] Cache write error\n:", error);
        },
      },
    );
    this.#startupPerfLogger?.point("persist_end");
  }
  async #watch(fileSystem, clocks, plugins) {
    this.#startupPerfLogger?.point("watch_start");
    if (!this.#options.watch) {
      this.#startupPerfLogger?.point("watch_end");
      return;
    }
    const hasWatchedExtension = (filePath) =>
      this.#options.extensions.some((ext) => filePath.endsWith(ext));
    let nextEmit = null;
    const emitChange = () => {
      if (nextEmit == null) {
        return;
      }
      const { events, firstEventTimestamp, firstEnqueuedTimestamp } = nextEmit;
      const changeAggregator =
        new _FileSystemChangeAggregator.FileSystemChangeAggregator();
      for (const event of events) {
        const { relativeFilePath, clock } = event;
        if (event.type === "delete") {
          fileSystem.remove(relativeFilePath, changeAggregator);
        } else {
          fileSystem.addOrModify(
            relativeFilePath,
            event.metadata,
            changeAggregator,
          );
        }
        this.#updateClock(clocks, clock);
      }
      const changeSize = changeAggregator.getSize();
      if (changeSize === 0) {
        nextEmit = null;
        return;
      }
      const _netChange = changeAggregator.getView();
      this.#plugins.forEach(({ plugin, dataIdx }) => {
        plugin.onChanged(
          changeAggregator.getMappedView(
            dataIdx != null ? (metadata) => metadata[dataIdx] : () => null,
          ),
        );
      });
      const toPublicMetadata = (metadata) => ({
        isSymlink: metadata[_constants.default.SYMLINK] !== 0,
        modifiedTime: metadata[_constants.default.MTIME] ?? null,
      });
      const changesWithMetadata =
        changeAggregator.getMappedView(toPublicMetadata);
      const hmrPerfLogger = this.#options.perfLoggerFactory?.("HMR", {
        key: this.#getNextChangeID(),
      });
      if (hmrPerfLogger != null) {
        hmrPerfLogger.start({
          timestamp: firstEventTimestamp,
        });
        hmrPerfLogger.point("waitingForChangeInterval_start", {
          timestamp: firstEnqueuedTimestamp,
        });
        hmrPerfLogger.point("waitingForChangeInterval_end");
        hmrPerfLogger.annotate({
          int: {
            changeSize,
          },
        });
        hmrPerfLogger.point("fileChange_start");
      }
      const changeEvent = {
        changes: changesWithMetadata,
        logger: hmrPerfLogger,
        rootDir: this.#options.rootDir,
      };
      this.emit("change", changeEvent);
      nextEmit = null;
    };
    let changeQueue = Promise.resolve();
    const onChange = (change) => {
      if (
        change.event !== "recrawl" &&
        change.metadata &&
        (change.metadata.type === "d" ||
          (change.metadata.type === "f" &&
            !hasWatchedExtension(change.relativePath)) ||
          (!this.#options.enableSymlinks && change.metadata?.type === "l"))
      ) {
        return;
      }
      const absoluteFilePath = path.join(
        change.root,
        (0, _normalizePathSeparatorsToSystem.default)(change.relativePath),
      );
      if (this.#options.ignorePattern.test(absoluteFilePath)) {
        return;
      }
      const relativeFilePath =
        this.#pathUtils.absoluteToNormal(absoluteFilePath);
      const onChangeStartTime =
        _perf_hooks.performance.timeOrigin + _perf_hooks.performance.now();
      const enqueueEvent = (event) => {
        nextEmit ??= {
          events: [],
          firstEnqueuedTimestamp:
            _perf_hooks.performance.timeOrigin + _perf_hooks.performance.now(),
          firstEventTimestamp: onChangeStartTime,
        };
        nextEmit.events.push(event);
      };
      changeQueue = changeQueue
        .then(async () => {
          if (
            nextEmit != null &&
            nextEmit.events.find(
              (event) =>
                event.type === change.event &&
                event.relativeFilePath === relativeFilePath &&
                ((!event.metadata && !change.metadata) ||
                  (event.metadata &&
                    change.metadata &&
                    event.metadata[_constants.default.MTIME] != null &&
                    change.metadata.modifiedTime != null &&
                    event.metadata[_constants.default.MTIME] ===
                      change.metadata.modifiedTime)),
            )
          ) {
            return null;
          }
          if (change.event === "touch") {
            (0, _invariant.default)(
              change.metadata.size != null,
              "since the file exists or changed, it should have known size",
            );
            const fileMetadata = [
              change.metadata.modifiedTime,
              change.metadata.size,
              0,
              null,
              change.metadata.type === "l" ? 1 : 0,
              null,
            ];
            try {
              if (change.metadata.type === "l") {
                await this.#maybeReadLink(relativeFilePath, fileMetadata);
              } else {
                await this.#fileProcessor.processRegularFile(
                  relativeFilePath,
                  fileMetadata,
                  {
                    computeSha1: this.#options.computeSha1,
                    maybeReturnContent: false,
                  },
                );
              }
              enqueueEvent({
                clock: change.clock,
                relativeFilePath,
                metadata: fileMetadata,
                type: change.event,
              });
            } catch (e) {
              if (!["ENOENT", "EACCESS"].includes(e.code)) {
                throw e;
              }
            }
          } else if (change.event === "delete") {
            enqueueEvent({
              clock: change.clock,
              relativeFilePath,
              type: "delete",
            });
          } else if (change.event === "recrawl") {
            emitChange();
            const absoluteDirPath = path.join(
              change.root,
              (0, _normalizePathSeparatorsToSystem.default)(
                change.relativePath,
              ),
            );
            const subpath = this.#pathUtils.absoluteToNormal(absoluteDirPath);
            const watcher = this.#watcher;
            (0, _invariant.default)(
              watcher != null,
              "Watcher must be initialized",
            );
            const crawlResult = await watcher.recrawl(subpath, fileSystem);
            if (
              crawlResult.changedFiles.size === 0 &&
              crawlResult.removedFiles.size === 0
            ) {
              return null;
            }
            const recrawlChangeAggregator = await this.#applyFileDelta(
              fileSystem,
              this.#plugins,
              crawlResult,
            );
            this.#updateClock(clocks, change.clock);
            if (recrawlChangeAggregator.getSize() === 0) {
              return null;
            }
            const toPublicMetadata = (metadata) => ({
              isSymlink: metadata[_constants.default.SYMLINK] !== 0,
              modifiedTime: metadata[_constants.default.MTIME] ?? null,
            });
            const changesWithMetadata =
              recrawlChangeAggregator.getMappedView(toPublicMetadata);
            const changeEvent = {
              changes: changesWithMetadata,
              logger: null,
              rootDir: this.#options.rootDir,
            };
            this.emit("change", changeEvent);
          } else {
            throw new Error(
              `metro-file-map: Unrecognized event type from watcher: ${change.event}`,
            );
          }
          return null;
        })
        .catch((error) => {
          this.#console.error(
            `metro-file-map: watch error:\n  ${error.stack}\n`,
          );
        });
    };
    this.#changeInterval = setInterval(emitChange, CHANGE_INTERVAL);
    (0, _invariant.default)(
      this.#watcher != null,
      "Expected #watcher to have been initialised by build()",
    );
    await this.#watcher.watch(onChange);
    if (this.#options.healthCheck.enabled) {
      const performHealthCheck = () => {
        if (!this.#watcher) {
          return;
        }
        this.#watcher
          .checkHealth(this.#options.healthCheck.timeout)
          .then((result) => {
            this.emit("healthCheck", result);
          });
      };
      performHealthCheck();
      this.#healthCheckInterval = setInterval(
        performHealthCheck,
        this.#options.healthCheck.interval,
      );
    }
    this.#startupPerfLogger?.point("watch_end");
  }
  async end() {
    if (this.#changeInterval) {
      clearInterval(this.#changeInterval);
    }
    if (this.#healthCheckInterval) {
      clearInterval(this.#healthCheckInterval);
    }
    this.#crawlerAbortController.abort();
    await Promise.all([
      this.#fileProcessor.end(),
      this.#watcher?.close(),
      this.#cacheManager.end(),
    ]);
  }
  async #shouldUseWatchman() {
    if (!this.#options.useWatchman) {
      return false;
    }
    if (!this.#canUseWatchmanPromise) {
      this.#canUseWatchmanPromise = (0, _checkWatchmanCapabilities.default)(
        WATCHMAN_REQUIRED_CAPABILITIES,
      )
        .then(({ version }) => {
          this.#startupPerfLogger?.annotate({
            string: {
              watchmanVersion: version,
            },
          });
          return true;
        })
        .catch((e) => {
          this.#startupPerfLogger?.annotate({
            string: {
              watchmanFailedCapabilityCheck: e?.message ?? "[missing]",
            },
          });
          return false;
        });
    }
    return this.#canUseWatchmanPromise;
  }
  #getNextChangeID() {
    if (this.#changeID >= Number.MAX_SAFE_INTEGER) {
      this.#changeID = 0;
    }
    return ++this.#changeID;
  }
  #updateClock(clocks, newClock) {
    if (newClock == null) {
      return;
    }
    const [absoluteWatchRoot, clockSpec] = newClock;
    const relativeFsRoot = this.#pathUtils.absoluteToNormal(absoluteWatchRoot);
    clocks.set(
      (0, _normalizePathSeparatorsToPosix.default)(relativeFsRoot),
      clockSpec,
    );
  }
  static H = _constants.default;
}
exports.default = FileMap;
const mapIterable = (it, fn) =>
  (function* mapped() {
    for (const item of it) {
      yield fn(item);
    }
  })();
