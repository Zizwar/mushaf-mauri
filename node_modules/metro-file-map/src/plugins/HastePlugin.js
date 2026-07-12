"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _constants = _interopRequireDefault(require("../constants"));
var _RootPathUtils = require("../lib/RootPathUtils");
var _sorting = require("../lib/sorting");
var _DuplicateHasteCandidatesError = require("./haste/DuplicateHasteCandidatesError");
var _getPlatformExtension = _interopRequireDefault(
  require("./haste/getPlatformExtension"),
);
var _HasteConflictsError = require("./haste/HasteConflictsError");
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const EMPTY_OBJ = {};
const EMPTY_MAP = new Map();
const PACKAGE_JSON = /(?:[/\\]|^)package\.json$/;
const YIELD_EVERY_NUM_HASTE_FILES = 10000;
class HastePlugin {
  name = "haste";
  #console;
  #duplicates = new Map();
  #enableHastePackages;
  #failValidationOnConflicts;
  #getModuleNameByPath;
  #hasteImplModulePath;
  #map = new Map();
  #pathUtils;
  #perfLogger;
  #platforms;
  #rootDir;
  constructor(options) {
    this.#console = options.console ?? global.console;
    this.#enableHastePackages = options.enableHastePackages;
    this.#hasteImplModulePath = options.hasteImplModulePath;
    this.#perfLogger = options.perfLogger;
    this.#platforms = options.platforms;
    this.#rootDir = options.rootDir;
    this.#pathUtils = new _RootPathUtils.RootPathUtils(options.rootDir);
    this.#failValidationOnConflicts = options.failValidationOnConflicts;
  }
  async initialize({ files }) {
    this.#perfLogger?.point("constructHasteMap_start");
    let hasteFiles = 0;
    for (const {
      baseName,
      canonicalPath,
      pluginData: hasteId,
    } of files.fileIterator({
      includeNodeModules: false,
      includeSymlinks: false,
    })) {
      if (hasteId == null) {
        continue;
      }
      this.setModule(hasteId, [
        canonicalPath,
        this.#enableHastePackages && baseName === "package.json"
          ? _constants.default.PACKAGE
          : _constants.default.MODULE,
      ]);
      if (++hasteFiles % YIELD_EVERY_NUM_HASTE_FILES === 0) {
        await new Promise(setImmediate);
      }
    }
    this.#getModuleNameByPath = (mixedPath) => {
      const result = files.lookup(mixedPath);
      return result.exists &&
        result.type === "f" &&
        typeof result.pluginData === "string"
        ? result.pluginData
        : null;
    };
    this.#perfLogger?.point("constructHasteMap_end");
    this.#perfLogger?.annotate({
      int: {
        hasteFiles,
      },
    });
  }
  getSerializableSnapshot() {
    return null;
  }
  getModule(name, platform, supportsNativePlatform, type) {
    const module = this.#getModuleMetadata(
      name,
      platform,
      !!supportsNativePlatform,
    );
    if (
      module &&
      module[_constants.default.TYPE] === (type ?? _constants.default.MODULE)
    ) {
      const modulePath = module[_constants.default.PATH];
      return modulePath && this.#pathUtils.normalToAbsolute(modulePath);
    }
    return null;
  }
  getModuleNameByPath(mixedPath) {
    if (this.#getModuleNameByPath == null) {
      throw new Error(
        "HastePlugin has not been initialized before getModuleNameByPath",
      );
    }
    return this.#getModuleNameByPath(mixedPath) ?? null;
  }
  getPackage(name, platform, _supportsNativePlatform) {
    return this.getModule(name, platform, null, _constants.default.PACKAGE);
  }
  #getModuleMetadata(name, platform, supportsNativePlatform) {
    const map = this.#map.get(name) || EMPTY_OBJ;
    const dupMap = this.#duplicates.get(name) || EMPTY_MAP;
    if (platform != null) {
      this.#assertNoDuplicates(
        name,
        platform,
        supportsNativePlatform,
        dupMap.get(platform),
      );
      if (map[platform] != null) {
        return map[platform];
      }
    }
    if (supportsNativePlatform) {
      this.#assertNoDuplicates(
        name,
        _constants.default.NATIVE_PLATFORM,
        supportsNativePlatform,
        dupMap.get(_constants.default.NATIVE_PLATFORM),
      );
      if (map[_constants.default.NATIVE_PLATFORM]) {
        return map[_constants.default.NATIVE_PLATFORM];
      }
    }
    this.#assertNoDuplicates(
      name,
      _constants.default.GENERIC_PLATFORM,
      supportsNativePlatform,
      dupMap.get(_constants.default.GENERIC_PLATFORM),
    );
    if (map[_constants.default.GENERIC_PLATFORM]) {
      return map[_constants.default.GENERIC_PLATFORM];
    }
    return null;
  }
  #assertNoDuplicates(name, platform, supportsNativePlatform, relativePathSet) {
    if (relativePathSet == null) {
      return;
    }
    const duplicates = new Map();
    for (const [relativePath, type] of relativePathSet) {
      const duplicatePath = this.#pathUtils.normalToAbsolute(relativePath);
      duplicates.set(duplicatePath, type);
    }
    throw new _DuplicateHasteCandidatesError.DuplicateHasteCandidatesError(
      name,
      platform,
      supportsNativePlatform,
      duplicates,
    );
  }
  onChanged(delta) {
    for (const [canonicalPath, maybeHasteId] of delta.removedFiles) {
      this.#onRemovedFile(canonicalPath, maybeHasteId);
    }
    for (const [canonicalPath, maybeHasteId] of delta.addedFiles) {
      this.#onNewFile(canonicalPath, maybeHasteId);
    }
  }
  #onNewFile(canonicalPath, id) {
    if (id == null) {
      return;
    }
    const module = [
      canonicalPath,
      this.#enableHastePackages &&
      _path.default.basename(canonicalPath) === "package.json"
        ? _constants.default.PACKAGE
        : _constants.default.MODULE,
    ];
    this.setModule(id, module);
  }
  setModule(id, module) {
    let hasteMapItem = this.#map.get(id);
    if (!hasteMapItem) {
      hasteMapItem = Object.create(null);
      this.#map.set(id, hasteMapItem);
    }
    const platform =
      (0, _getPlatformExtension.default)(
        module[_constants.default.PATH],
        this.#platforms,
      ) || _constants.default.GENERIC_PLATFORM;
    const existingModule = hasteMapItem[platform];
    if (
      existingModule &&
      existingModule[_constants.default.PATH] !==
        module[_constants.default.PATH]
    ) {
      if (this.#console) {
        this.#console.warn(
          [
            "metro-file-map: Haste module naming collision: " + id,
            "  The following files share their name; please adjust your hasteImpl:",
            "    * <rootDir>" +
              _path.default.sep +
              existingModule[_constants.default.PATH],
            "    * <rootDir>" +
              _path.default.sep +
              module[_constants.default.PATH],
            "",
          ].join("\n"),
        );
      }
      delete hasteMapItem[platform];
      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(id);
      }
      let dupsByPlatform = this.#duplicates.get(id);
      if (dupsByPlatform == null) {
        dupsByPlatform = new Map();
        this.#duplicates.set(id, dupsByPlatform);
      }
      const dups = new Map([
        [module[_constants.default.PATH], module[_constants.default.TYPE]],
        [
          existingModule[_constants.default.PATH],
          existingModule[_constants.default.TYPE],
        ],
      ]);
      dupsByPlatform.set(platform, dups);
      return;
    }
    const dupsByPlatform = this.#duplicates.get(id);
    if (dupsByPlatform != null) {
      const dups = dupsByPlatform.get(platform);
      if (dups != null) {
        dups.set(
          module[_constants.default.PATH],
          module[_constants.default.TYPE],
        );
      }
      return;
    }
    hasteMapItem[platform] = module;
  }
  #onRemovedFile(canonicalPath, moduleName) {
    if (moduleName == null) {
      return;
    }
    const platform =
      (0, _getPlatformExtension.default)(canonicalPath, this.#platforms) ||
      _constants.default.GENERIC_PLATFORM;
    const hasteMapItem = this.#map.get(moduleName);
    if (hasteMapItem != null) {
      delete hasteMapItem[platform];
      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(moduleName);
      } else {
        this.#map.set(moduleName, hasteMapItem);
      }
    }
    this.#recoverDuplicates(moduleName, canonicalPath);
  }
  assertValid() {
    if (!this.#failValidationOnConflicts) {
      return;
    }
    const conflicts = this.computeConflicts();
    if (conflicts.length > 0) {
      throw new _HasteConflictsError.HasteConflictsError(conflicts);
    }
  }
  #recoverDuplicates(moduleName, relativeFilePath) {
    let dupsByPlatform = this.#duplicates.get(moduleName);
    if (dupsByPlatform == null) {
      return;
    }
    const platform =
      (0, _getPlatformExtension.default)(relativeFilePath, this.#platforms) ||
      _constants.default.GENERIC_PLATFORM;
    let dups = dupsByPlatform.get(platform);
    if (dups == null) {
      return;
    }
    dupsByPlatform = new Map(dupsByPlatform);
    this.#duplicates.set(moduleName, dupsByPlatform);
    dups = new Map(dups);
    dupsByPlatform.set(platform, dups);
    dups.delete(relativeFilePath);
    if (dups.size !== 1) {
      return;
    }
    const uniqueModule = dups.entries().next().value;
    if (!uniqueModule) {
      return;
    }
    let dedupMap = this.#map.get(moduleName);
    if (dedupMap == null) {
      dedupMap = Object.create(null);
      this.#map.set(moduleName, dedupMap);
    }
    dedupMap[platform] = uniqueModule;
    dupsByPlatform.delete(platform);
    if (dupsByPlatform.size === 0) {
      this.#duplicates.delete(moduleName);
    }
  }
  computeConflicts() {
    const conflicts = [];
    for (const [id, dupsByPlatform] of this.#duplicates.entries()) {
      for (const [platform, conflictingModules] of dupsByPlatform) {
        conflicts.push({
          absolutePaths: [...conflictingModules.keys()]
            .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
            .sort(),
          id,
          platform:
            platform === _constants.default.GENERIC_PLATFORM ? null : platform,
          type: "duplicate",
        });
      }
    }
    for (const [id, data] of this.#map) {
      const conflictPaths = new Set();
      const basePaths = [];
      for (const basePlatform of [
        _constants.default.NATIVE_PLATFORM,
        _constants.default.GENERIC_PLATFORM,
      ]) {
        if (data[basePlatform] == null) {
          continue;
        }
        const basePath = data[basePlatform][0];
        basePaths.push(basePath);
        const basePathDir = _path.default.dirname(basePath);
        for (const platform of Object.keys(data)) {
          if (
            platform === basePlatform ||
            platform === _constants.default.GENERIC_PLATFORM
          ) {
            continue;
          }
          const platformPath = data[platform][0];
          if (_path.default.dirname(platformPath) !== basePathDir) {
            conflictPaths.add(platformPath);
          }
        }
      }
      if (conflictPaths.size) {
        conflicts.push({
          absolutePaths: [...new Set([...conflictPaths, ...basePaths])]
            .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
            .sort(),
          id,
          platform: null,
          type: "shadowing",
        });
      }
    }
    conflicts.sort(
      (0, _sorting.chainComparators)(
        (a, b) => (0, _sorting.compareStrings)(a.type, b.type),
        (a, b) => (0, _sorting.compareStrings)(a.id, b.id),
        (a, b) => (0, _sorting.compareStrings)(a.platform, b.platform),
      ),
    );
    return conflicts;
  }
  getCacheKey() {
    return JSON.stringify([
      this.#enableHastePackages,
      this.#hasteImplModulePath != null
        ? require(this.#hasteImplModulePath).getCacheKey()
        : null,
      [...this.#platforms].sort(),
    ]);
  }
  getWorker() {
    return {
      worker: {
        modulePath: require.resolve("./haste/worker.js"),
        setupArgs: {
          hasteImplModulePath: this.#hasteImplModulePath ?? null,
        },
      },
      filter: ({ isNodeModules, normalPath }) => {
        if (isNodeModules) {
          return false;
        }
        if (PACKAGE_JSON.test(normalPath)) {
          return this.#enableHastePackages;
        }
        return this.#hasteImplModulePath != null;
      },
    };
  }
}
exports.default = HastePlugin;
