"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = rootRelativeCacheKeys;
var _normalizePathSeparatorsToPosix = _interopRequireDefault(
  require("./normalizePathSeparatorsToPosix"),
);
var _RootPathUtils = require("./RootPathUtils");
var _crypto = require("crypto");
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function rootRelativeCacheKeys(buildParameters) {
  const { rootDir, plugins, ...otherParameters } = buildParameters;
  const rootDirHash = (0, _crypto.createHash)("md5")
    .update((0, _normalizePathSeparatorsToPosix.default)(rootDir))
    .digest("hex");
  const pathUtils = new _RootPathUtils.RootPathUtils(rootDir);
  const cacheComponents = Object.keys(otherParameters)
    .sort()
    .map((key) => {
      switch (key) {
        case "roots":
          return buildParameters[key].map((root) =>
            (0, _normalizePathSeparatorsToPosix.default)(
              pathUtils.absoluteToNormal(root),
            ),
          );
        case "cacheBreaker":
        case "extensions":
        case "computeSha1":
        case "enableSymlinks":
        case "forceNodeFilesystemAPI":
        case "retainAllFiles":
          return buildParameters[key] ?? null;
        case "ignorePattern":
          return buildParameters[key].toString();
        default:
          key;
          throw new Error("Unrecognised key in build parameters: " + key);
      }
    });
  for (const plugin of plugins) {
    cacheComponents.push(plugin.getCacheKey());
  }
  const relativeConfigHash = (0, _crypto.createHash)("md5")
    .update(JSON.stringify(cacheComponents))
    .digest("hex");
  return {
    rootDirHash,
    relativeConfigHash,
  };
}
