"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = getPrependedScripts;
var _CountingSet = _interopRequireDefault(require("./CountingSet"));
var _countLines = _interopRequireDefault(require("./countLines"));
var _getPreludeCode = _interopRequireDefault(require("./getPreludeCode"));
var transformHelpers = _interopRequireWildcard(require("./transformHelpers"));
var defaults = _interopRequireWildcard(
  require("metro-config/private/defaults/defaults"),
);
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
async function getPrependedScripts(
  config,
  options,
  resolverOptions,
  bundler,
  deltaBundler,
) {
  const polyfillModuleNames = config.serializer
    .getPolyfills({
      platform: options.platform,
    })
    .concat(config.serializer.polyfillModuleNames);
  const transformOptions = {
    ...options,
    type: "script",
  };
  const dependencies = await deltaBundler.getDependencies(
    [defaults.moduleSystem, ...polyfillModuleNames],
    {
      resolve: await transformHelpers.getResolveDependencyFn(
        bundler,
        options.platform,
        resolverOptions,
      ),
      transform: await transformHelpers.getTransformFn(
        [defaults.moduleSystem, ...polyfillModuleNames],
        bundler,
        deltaBundler,
        config,
        transformOptions,
        resolverOptions,
      ),
      unstable_allowRequireContext:
        config.transformer.unstable_allowRequireContext,
      transformOptions,
      onProgress: null,
      lazy: false,
      unstable_enablePackageExports:
        config.resolver.unstable_enablePackageExports,
      unstable_incrementalResolution:
        config.resolver.unstable_incrementalResolution,
      shallow: false,
    },
  );
  return [
    _getPrelude({
      dev: options.dev,
      globalPrefix: config.transformer.globalPrefix,
      requireCycleIgnorePatterns: config.resolver.requireCycleIgnorePatterns,
      unstable_forceFullRefreshPatterns:
        config.resolver.unstable_forceFullRefreshPatterns,
    }),
    ...dependencies.values(),
  ];
}
function _getPrelude({
  dev,
  globalPrefix,
  requireCycleIgnorePatterns,
  unstable_forceFullRefreshPatterns,
}) {
  const code = (0, _getPreludeCode.default)({
    isDev: dev,
    globalPrefix,
    requireCycleIgnorePatterns,
    unstable_forceFullRefreshPatterns,
  });
  const name = "__prelude__";
  return {
    dependencies: new Map(),
    getSource: () => Buffer.from(code),
    inverseDependencies: new _CountingSet.default(),
    path: name,
    output: [
      {
        type: "js/script/virtual",
        data: {
          code,
          lineCount: (0, _countLines.default)(code),
          map: [],
        },
      },
    ],
  };
}
