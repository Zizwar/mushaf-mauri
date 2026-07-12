"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.FileProcessor = void 0;
var _constants = _interopRequireDefault(require("../constants"));
var _worker = require("../worker");
var _RootPathUtils = require("./RootPathUtils");
var _jestWorker = require("jest-worker");
var _path = require("path");
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const debug = require("debug")("Metro:FileMap");
const NODE_MODULES_SEP = "node_modules" + _path.sep;
const MAX_FILES_PER_WORKER = 100;
class FileProcessor {
  #maxFilesPerWorker;
  #maxWorkers;
  #perfLogger;
  #pluginWorkers;
  #inBandWorker;
  #rootPathUtils;
  constructor(opts) {
    this.#maxFilesPerWorker = opts.maxFilesPerWorker ?? MAX_FILES_PER_WORKER;
    this.#maxWorkers = opts.maxWorkers;
    this.#pluginWorkers = opts.pluginWorkers ?? [];
    this.#inBandWorker = new _worker.Worker({
      plugins: this.#pluginWorkers.map((plugin) => plugin.worker),
    });
    this.#perfLogger = opts.perfLogger;
    this.#rootPathUtils = new _RootPathUtils.RootPathUtils(opts.rootDir);
  }
  async processBatch(files, req) {
    const errors = [];
    const workerJobs = files
      .map(([normalFilePath, fileMetadata]) => {
        const maybeWorkerInput = this.#getWorkerInput(
          normalFilePath,
          fileMetadata,
          req,
        );
        if (!maybeWorkerInput) {
          return null;
        }
        return [maybeWorkerInput, fileMetadata];
      })
      .filter(Boolean);
    const numWorkers = Math.min(
      this.#maxWorkers,
      Math.ceil(workerJobs.length / this.#maxFilesPerWorker),
    );
    const batchWorker = this.#getBatchWorker(numWorkers);
    if (req.maybeReturnContent) {
      throw new Error(
        "Batch processing does not support returning file contents",
      );
    }
    await Promise.all(
      workerJobs.map(([workerInput, fileMetadata]) => {
        return batchWorker
          .processFile(workerInput)
          .then((reply) =>
            processWorkerReply(reply, workerInput.pluginsToRun, fileMetadata),
          )
          .catch((error) =>
            errors.push({
              normalFilePath: this.#rootPathUtils.absoluteToNormal(
                workerInput.filePath,
              ),
              error: normalizeWorkerError(error),
            }),
          );
      }),
    );
    await batchWorker.end();
    return {
      errors,
    };
  }
  processRegularFile(normalPath, fileMetadata, req) {
    const workerInput = this.#getWorkerInput(normalPath, fileMetadata, req);
    return workerInput
      ? {
          content: processWorkerReply(
            this.#inBandWorker.processFile(workerInput),
            workerInput.pluginsToRun,
            fileMetadata,
          ),
        }
      : null;
  }
  #getWorkerInput(normalPath, fileMetadata, req) {
    if (fileMetadata[_constants.default.SYMLINK] !== 0) {
      return null;
    }
    const computeSha1 =
      req.computeSha1 && fileMetadata[_constants.default.SHA1] == null;
    const { maybeReturnContent } = req;
    const nodeModulesIdx = normalPath.indexOf(NODE_MODULES_SEP);
    const isNodeModules =
      nodeModulesIdx === 0 ||
      (nodeModulesIdx > 0 && normalPath[nodeModulesIdx - 1] === _path.sep);
    const pluginsToRun =
      this.#pluginWorkers?.reduce((prev, plugin, idx) => {
        if (
          plugin.filter({
            isNodeModules,
            normalPath,
          })
        ) {
          prev.push(idx);
        }
        return prev;
      }, []) ?? [];
    if (!computeSha1 && pluginsToRun.length === 0) {
      return null;
    }
    if (isNodeModules) {
      if (computeSha1) {
        return {
          computeSha1: true,
          filePath: this.#rootPathUtils.normalToAbsolute(normalPath),
          maybeReturnContent,
          pluginsToRun,
        };
      }
      return null;
    }
    return {
      computeSha1,
      filePath: this.#rootPathUtils.normalToAbsolute(normalPath),
      maybeReturnContent,
      pluginsToRun,
    };
  }
  #getBatchWorker(numWorkers) {
    if (numWorkers <= 1) {
      return {
        processFile: async (message) => this.#inBandWorker.processFile(message),
        end: async () => {},
      };
    }
    const workerPath = require.resolve("../worker");
    debug("Creating worker farm of %d worker threads", numWorkers);
    this.#perfLogger?.point("initWorkers_start");
    const jestWorker = new _jestWorker.Worker(workerPath, {
      exposedMethods: ["processFile"],
      maxRetries: 3,
      numWorkers,
      enableWorkerThreads: true,
      forkOptions: {
        execArgv: [],
      },
      setupArgs: [
        {
          plugins: this.#pluginWorkers.map((plugin) => plugin.worker),
        },
      ],
    });
    this.#perfLogger?.point("initWorkers_end");
    this.#perfLogger = null;
    return jestWorker;
  }
  async end() {}
}
exports.FileProcessor = FileProcessor;
function processWorkerReply(metadata, pluginsRun, fileMetadata) {
  fileMetadata[_constants.default.VISITED] = 1;
  const pluginData = metadata.pluginData;
  if (pluginData) {
    for (const [i, pluginIdx] of pluginsRun.entries()) {
      fileMetadata[_constants.default.PLUGINDATA + pluginIdx] = pluginData[i];
    }
  }
  if (metadata.sha1 != null) {
    fileMetadata[_constants.default.SHA1] = metadata.sha1;
  }
  return metadata.content;
}
function normalizeWorkerError(mixedError) {
  if (
    mixedError == null ||
    typeof mixedError !== "object" ||
    mixedError.message == null ||
    mixedError.stack == null
  ) {
    const error = new Error(mixedError);
    error.stack = "";
    return error;
  }
  return mixedError;
}
