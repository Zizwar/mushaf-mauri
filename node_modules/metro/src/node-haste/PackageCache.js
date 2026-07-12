"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.PackageCache = void 0;
var _fs = require("fs");
var _path = require("path");
class PackageCache {
  #getClosestPackage;
  #packageCache;
  #resultByModulePath;
  #modulePathsByPackagePath;
  #modulePathsWithNoPackage;
  constructor(options) {
    this.#getClosestPackage = options.getClosestPackage;
    this.#packageCache = new Map();
    this.#resultByModulePath = new Map();
    this.#modulePathsByPackagePath = new Map();
    this.#modulePathsWithNoPackage = new Set();
  }
  getPackage(filePath) {
    let cached = this.#packageCache.get(filePath);
    if (cached == null) {
      cached = {
        rootPath: (0, _path.dirname)(filePath),
        packageJson: JSON.parse((0, _fs.readFileSync)(filePath, "utf8")),
      };
      this.#packageCache.set(filePath, cached);
    }
    return cached;
  }
  getPackageForModule(absoluteModulePath) {
    const cached = this.#resultByModulePath.get(absoluteModulePath);
    if (cached !== undefined) {
      return cached;
    }
    const closest = this.#getClosestPackage(absoluteModulePath);
    if (closest == null) {
      this.#resultByModulePath.set(absoluteModulePath, null);
      this.#modulePathsWithNoPackage.add(absoluteModulePath);
      return null;
    }
    const packagePath = closest.packageJsonPath;
    let modulePaths = this.#modulePathsByPackagePath.get(packagePath);
    if (modulePaths == null) {
      modulePaths = new Set();
      this.#modulePathsByPackagePath.set(packagePath, modulePaths);
    }
    modulePaths.add(absoluteModulePath);
    const pkg = this.getPackage(packagePath);
    if (pkg == null) {
      return null;
    }
    const result = {
      packageJson: pkg.packageJson,
      packageRelativePath: closest.packageRelativePath,
      rootPath: pkg.rootPath,
    };
    this.#resultByModulePath.set(absoluteModulePath, result);
    return result;
  }
  invalidate(filePath) {
    this.#packageCache.delete(filePath);
    const cachedResult = this.#resultByModulePath.get(filePath);
    this.#resultByModulePath.delete(filePath);
    this.#modulePathsWithNoPackage.delete(filePath);
    if (cachedResult != null) {
      const packagePath = cachedResult.rootPath + _path.sep + "package.json";
      const modules = this.#modulePathsByPackagePath.get(packagePath);
      if (modules != null) {
        modules.delete(filePath);
        if (modules.size === 0) {
          this.#modulePathsByPackagePath.delete(packagePath);
        }
      }
    }
    const modulePaths = this.#modulePathsByPackagePath.get(filePath);
    if (modulePaths != null) {
      for (const modulePath of modulePaths) {
        this.#resultByModulePath.delete(modulePath);
      }
      this.#modulePathsByPackagePath.delete(filePath);
    }
    if (filePath.endsWith(_path.sep + "package.json")) {
      for (const modulePath of this.#modulePathsWithNoPackage) {
        this.#resultByModulePath.delete(modulePath);
      }
      this.#modulePathsWithNoPackage.clear();
    }
  }
}
exports.PackageCache = PackageCache;
