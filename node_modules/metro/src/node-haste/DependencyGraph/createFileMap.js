"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = createFileMap;
var _ciInfo = _interopRequireDefault(require("ci-info"));
var _metroFileMap = _interopRequireWildcard(require("metro-file-map"));
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
function getIgnorePattern(config) {
  const { blockList, blacklistRE } = config.resolver;
  const ignorePattern = blacklistRE || blockList;
  if (!ignorePattern) {
    return / ^/;
  }
  const combine = (regexes) =>
    new RegExp(
      regexes
        .map((regex, index) => {
          if (regex.flags !== regexes[0].flags) {
            throw new Error(
              "Cannot combine blockList patterns, because they have different flags:\n" +
                " - Pattern 0: " +
                regexes[0].toString() +
                "\n" +
                ` - Pattern ${index}: ` +
                regexes[index].toString(),
            );
          }
          return "(" + regex.source + ")";
        })
        .join("|"),
      regexes[0]?.flags ?? "",
    );
  if (Array.isArray(ignorePattern)) {
    return combine(ignorePattern);
  }
  return ignorePattern;
}
function createFileMap(config, options) {
  const watch = options?.watch == null ? !_ciInfo.default.isCI : options.watch;
  const { enabled: autoSaveEnabled, ...autoSaveOpts } =
    config.watcher.unstable_autoSaveCache ?? {};
  const autoSave = watch && autoSaveEnabled ? autoSaveOpts : false;
  const plugins = [...(config.unstable_fileMapPlugins ?? [])];
  let dependencyPlugin = null;
  if (
    config.resolver.dependencyExtractor != null &&
    options?.extractDependencies !== false
  ) {
    dependencyPlugin = new _metroFileMap.DependencyPlugin({
      dependencyExtractor: config.resolver.dependencyExtractor,
      computeDependencies: true,
    });
    plugins.push(dependencyPlugin);
  }
  const hasteMap = new _metroFileMap.HastePlugin({
    platforms: new Set([
      ...config.resolver.platforms,
      _metroFileMap.default.H.NATIVE_PLATFORM,
    ]),
    hasteImplModulePath: config.resolver.hasteImplModulePath,
    enableHastePackages: config.resolver.enableGlobalPackages,
    rootDir: config.projectRoot,
    failValidationOnConflicts: options?.throwOnModuleCollision ?? true,
  });
  plugins.push(hasteMap);
  const fileMap = new _metroFileMap.default({
    cacheManagerFactory:
      config?.unstable_fileMapCacheManagerFactory ??
      ((factoryParams) =>
        new _metroFileMap.DiskCacheManager(factoryParams, {
          cacheDirectory:
            config.fileMapCacheDirectory ?? config.hasteMapCacheDirectory,
          cacheFilePrefix: options?.cacheFilePrefix,
          autoSave,
        })),
    perfLoggerFactory: config.unstable_perfLoggerFactory,
    computeSha1: !config.watcher.unstable_lazySha1,
    enableSymlinks: true,
    extensions: Array.from(
      new Set([
        ...config.resolver.sourceExts,
        ...config.resolver.assetExts,
        ...config.watcher.additionalExts,
      ]),
    ),
    forceNodeFilesystemAPI: !config.resolver.useWatchman,
    healthCheck: config.watcher.healthCheck,
    ignorePattern: getIgnorePattern(config),
    maxWorkers: config.maxWorkers,
    plugins,
    retainAllFiles: true,
    resetCache: config.resetCache,
    rootDir: config.projectRoot,
    roots: config.watchFolders,
    useWatchman: config.resolver.useWatchman,
    watch,
    watchmanDeferStates: config.watcher.watchman.deferStates,
  });
  return {
    fileMap,
    hasteMap,
    dependencyPlugin,
  };
}
