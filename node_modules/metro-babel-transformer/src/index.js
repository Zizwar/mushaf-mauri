"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
exports.getCacheKey = getCacheKey;
exports.transform = transform;
var _core = require("@babel/core");
var _metroCacheKey = require("metro-cache-key");
var _nullthrows = _interopRequireDefault(require("nullthrows"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function transform({ filename, options, plugins, src }) {
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev
    ? "development"
    : process.env.BABEL_ENV || "production";
  try {
    const babelConfig = {
      ast: true,
      babelrc: options.enableBabelRCLookup,
      caller: {
        bundler: "metro",
        name: "metro",
        platform: options.platform,
      },
      cloneInputAst: false,
      code: false,
      cwd: options.projectRoot,
      filename,
      highlightCode: true,
      plugins,
      sourceType: "module",
    };
    const sourceAst = options.hermesParser
      ? require("hermes-parser").parse(src, {
          babel: true,
          sourceType: babelConfig.sourceType,
        })
      : (0, _core.parseSync)(src, babelConfig);
    const transformResult = (0, _core.transformFromAstSync)(
      sourceAst,
      src,
      babelConfig,
    );
    return {
      ast: (0, _nullthrows.default)(transformResult.ast),
      metadata: transformResult.metadata,
    };
  } finally {
    if (OLD_BABEL_ENV == null) {
      delete process.env.BABEL_ENV;
    } else {
      process.env.BABEL_ENV = OLD_BABEL_ENV;
    }
  }
}
function getCacheKey(options) {
  if (options == null) {
    return "";
  }
  const partialConfig = (0, _core.loadPartialConfigSync)({
    cwd: options.projectRoot,
    root: options.projectRoot,
    babelrc: options.enableBabelRCLookup ?? true,
  });
  const files = partialConfig?.files;
  if (files == null || files.size === 0) {
    return "";
  }
  return (0, _metroCacheKey.getCacheKey)([...files].sort());
}
var _default = (exports.default = {
  transform,
  getCacheKey,
});
