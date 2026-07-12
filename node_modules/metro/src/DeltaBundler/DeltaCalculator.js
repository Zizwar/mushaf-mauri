"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _Graph = require("./Graph");
var _crypto = _interopRequireDefault(require("crypto"));
var _events = _interopRequireDefault(require("events"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const debug = require("debug")("Metro:DeltaCalculator");
const changeEventIds = new WeakMap();
class DeltaCalculator extends _events.default {
  _deletedFiles = new Set();
  _modifiedFiles = new Set();
  _addedFiles = new Set();
  _requiresReset = false;
  constructor(entryPoints, changeEventSource, options) {
    super();
    this._options = options;
    this._changeEventSource = changeEventSource;
    this._graph = new _Graph.Graph({
      entryPoints,
      transformOptions: this._options.transformOptions,
    });
    this._changeEventSource.on("change", this._handleMultipleFileChanges);
  }
  end() {
    this._changeEventSource.removeListener(
      "change",
      this._handleMultipleFileChanges,
    );
    this.removeAllListeners();
    this._graph = new _Graph.Graph({
      entryPoints: this._graph.entryPoints,
      transformOptions: this._options.transformOptions,
    });
    this._modifiedFiles = new Set();
    this._deletedFiles = new Set();
    this._addedFiles = new Set();
  }
  async getDelta({ reset, shallow }) {
    debug("Calculating delta (reset: %s, shallow: %s)", reset, shallow);
    if (this._currentBuildPromise) {
      await this._currentBuildPromise;
    }
    const modifiedFiles = this._modifiedFiles;
    this._modifiedFiles = new Set();
    const deletedFiles = this._deletedFiles;
    this._deletedFiles = new Set();
    const addedFiles = this._addedFiles;
    this._addedFiles = new Set();
    const requiresReset = this._requiresReset;
    this._requiresReset = false;
    if (requiresReset) {
      const markModified = (file) => {
        if (!addedFiles.has(file) && !deletedFiles.has(file)) {
          modifiedFiles.add(file);
        }
      };
      this._graph.dependencies.forEach((_, key) => markModified(key));
      this._graph.entryPoints.forEach(markModified);
    }
    this._currentBuildPromise = this._getChangedDependencies(
      modifiedFiles,
      deletedFiles,
      addedFiles,
    );
    let result;
    try {
      result = await this._currentBuildPromise;
    } catch (error) {
      modifiedFiles.forEach((file) => this._modifiedFiles.add(file));
      deletedFiles.forEach((file) => this._deletedFiles.add(file));
      addedFiles.forEach((file) => this._addedFiles.add(file));
      throw error;
    } finally {
      this._currentBuildPromise = null;
    }
    if (reset) {
      this._graph.reorderGraph({
        shallow,
      });
      return {
        added: this._graph.dependencies,
        deleted: new Set(),
        modified: new Map(),
        reset: true,
      };
    }
    return result;
  }
  getGraph() {
    return this._graph;
  }
  #shouldReset(canonicalPath, metadata) {
    if (metadata.isSymlink) {
      return true;
    }
    if (
      this._options.unstable_enablePackageExports &&
      (canonicalPath === "package.json" ||
        canonicalPath.endsWith(_path.default.sep + "package.json"))
    ) {
      return true;
    }
    return false;
  }
  _handleMultipleFileChanges = (changeEvent) => {
    const { changes, logger, rootDir } = changeEvent;
    for (const [canonicalPath, metadata] of changes.addedFiles) {
      debug("Handling add: %s", canonicalPath);
      if (this.#shouldReset(canonicalPath, metadata)) {
        this._requiresReset = true;
      }
      const absolutePath = _path.default.join(rootDir, canonicalPath);
      if (this._deletedFiles.has(absolutePath)) {
        this._deletedFiles.delete(absolutePath);
        this._modifiedFiles.add(absolutePath);
      } else {
        this._addedFiles.add(absolutePath);
        this._modifiedFiles.delete(absolutePath);
      }
    }
    for (const [canonicalPath, metadata] of changes.modifiedFiles) {
      debug("Handling change: %s", canonicalPath);
      if (this.#shouldReset(canonicalPath, metadata)) {
        this._requiresReset = true;
      }
      const absolutePath = _path.default.join(rootDir, canonicalPath);
      if (!this._addedFiles.has(absolutePath)) {
        this._modifiedFiles.add(absolutePath);
      }
      this._deletedFiles.delete(absolutePath);
    }
    for (const [canonicalPath, metadata] of changes.removedFiles) {
      debug("Handling delete: %s", canonicalPath);
      if (this.#shouldReset(canonicalPath, metadata)) {
        this._requiresReset = true;
      }
      const absolutePath = _path.default.resolve(rootDir, canonicalPath);
      if (this._addedFiles.has(absolutePath)) {
        this._addedFiles.delete(absolutePath);
      } else {
        this._deletedFiles.add(absolutePath);
        this._modifiedFiles.delete(absolutePath);
      }
    }
    let changeId = changeEventIds.get(changeEvent);
    if (changeId == null) {
      changeId = _crypto.default.randomUUID();
      changeEventIds.set(changeEvent, changeId);
    }
    this.emit("change", {
      logger,
      changeId,
    });
  };
  async _getChangedDependencies(modifiedFiles, deletedFiles, addedFiles) {
    if (!this._graph.dependencies.size) {
      const { added } = await this._graph.initialTraverseDependencies(
        this._options,
      );
      return {
        added,
        deleted: new Set(),
        modified: new Map(),
        reset: true,
      };
    }
    deletedFiles.forEach((filePath) => {
      for (const modifiedModulePath of this._graph.getModifiedModulesForDeletedPath(
        filePath,
      )) {
        if (!deletedFiles.has(modifiedModulePath)) {
          modifiedFiles.add(modifiedModulePath);
        }
      }
    });
    if (this._options.unstable_allowRequireContext) {
      addedFiles.forEach((filePath) => {
        this._graph.markModifiedContextModules(filePath, modifiedFiles);
      });
    }
    const modifiedDependencies = Array.from(modifiedFiles).filter((filePath) =>
      this._graph.dependencies.has(filePath),
    );
    if (modifiedDependencies.length === 0) {
      return {
        added: new Map(),
        deleted: new Set(),
        modified: new Map(),
        reset: false,
      };
    }
    debug("Traversing dependencies for %s paths", modifiedDependencies.length);
    const { added, modified, deleted } = await this._graph.traverseDependencies(
      modifiedDependencies,
      this._options,
    );
    debug(
      "Calculated graph delta {added: %s, modified: %d, deleted: %d}",
      added.size,
      modified.size,
      deleted.size,
    );
    return {
      added,
      deleted,
      modified,
      reset: false,
    };
  }
}
exports.default = DeltaCalculator;
