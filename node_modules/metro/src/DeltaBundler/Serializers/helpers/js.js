"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.getJsOutput = getJsOutput;
exports.getModuleParams = getModuleParams;
exports.isJsModule = isJsModule;
exports.wrapModule = wrapModule;
var _isResolvedDependency = require("../../../lib/isResolvedDependency");
var _pathUtils = require("../../../lib/pathUtils");
var _invariant = _interopRequireDefault(require("invariant"));
var jscSafeUrl = _interopRequireWildcard(require("jsc-safe-url"));
var _metroTransformPlugins = require("metro-transform-plugins");
var _path = _interopRequireDefault(require("path"));
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
function wrapModule(module, options) {
  const output = getJsOutput(module);
  if (output.type.startsWith("js/script")) {
    return output.data.code;
  }
  const params = getModuleParams(module, options);
  return (0, _metroTransformPlugins.addParamsToDefineCall)(
    output.data.code,
    ...params,
  );
}
function getModuleParams(module, options) {
  const moduleId = options.createModuleId(module.path);
  const paths = {};
  let hasPaths = false;
  const dependencyMapArray = Array.from(module.dependencies.values()).map(
    (dependency) => {
      if (!(0, _isResolvedDependency.isResolvedDependency)(dependency)) {
        return null;
      }
      const id = options.createModuleId(dependency.absolutePath);
      if (options.includeAsyncPaths && dependency.data.data.asyncType != null) {
        hasPaths = true;
        (0, _invariant.default)(
          options.sourceUrl != null,
          "sourceUrl is required when includeAsyncPaths is true",
        );
        const { searchParams } = new URL(
          jscSafeUrl.toNormalUrl(options.sourceUrl),
        );
        searchParams.set("modulesOnly", "true");
        searchParams.set("runModule", "false");
        const bundlePath = _path.default.relative(
          options.serverRoot,
          dependency.absolutePath,
        );
        paths[id] =
          "/" +
          _path.default.join(
            _path.default.dirname(bundlePath),
            _path.default.basename(
              bundlePath,
              _path.default.extname(bundlePath),
            ),
          ) +
          ".bundle?" +
          searchParams.toString();
      }
      return id;
    },
  );
  const params = [
    moduleId,
    hasPaths
      ? {
          ...dependencyMapArray,
          paths,
        }
      : dependencyMapArray,
  ];
  if (options.dev) {
    params.push(
      (0, _pathUtils.normalizePathSeparatorsToPosix)(
        _path.default.relative(options.projectRoot, module.path),
      ),
    );
  }
  return params;
}
function getJsOutput(module) {
  const jsModules = module.output.filter(({ type }) => type.startsWith("js/"));
  (0, _invariant.default)(
    jsModules.length === 1,
    `Modules must have exactly one JS output, but ${module.path ?? "unknown module"} has ${jsModules.length} JS outputs.`,
  );
  const jsOutput = jsModules[0];
  (0, _invariant.default)(
    Number.isFinite(jsOutput.data.lineCount),
    `JS output must populate lineCount, but ${module.path ?? "unknown module"} has ${jsOutput.type} output with lineCount '${jsOutput.data.lineCount}'`,
  );
  return jsOutput;
}
function isJsModule(module) {
  return module.output.filter(isJsOutput).length > 0;
}
function isJsOutput(output) {
  return output.type.startsWith("js/");
}
