"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = parseBundleOptionsFromBundleRequestUrl;
var _parsePlatformFilePath = _interopRequireDefault(
  require("../node-haste/lib/parsePlatformFilePath"),
);
var _types = require("../shared/types");
var _parseCustomResolverOptions = _interopRequireDefault(
  require("./parseCustomResolverOptions"),
);
var _parseCustomTransformOptions = _interopRequireDefault(
  require("./parseCustomTransformOptions"),
);
var jscSafeUrl = _interopRequireWildcard(require("jsc-safe-url"));
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
const debug = require("debug")(
  "Metro:Server:parseBundleOptionsFromBundleRequestUrl",
);
const TRUE_STRINGS = new Set(["true", "1"]);
const RESOLVE_BASE_URL = "resolve://";
const getBoolQueryParam = (searchParams, opt, defaultValue) =>
  searchParams.has(opt)
    ? TRUE_STRINGS.has(searchParams.get(opt) || "")
    : defaultValue;
const getBundleType = (bundleType) =>
  bundleType === "map" ? bundleType : "bundle";
const getTransformProfile = (transformProfile) =>
  transformProfile === "hermes-stable" || transformProfile === "hermes-canary"
    ? transformProfile
    : "default";
function parseBundleOptionsFromBundleRequestUrl(
  rawNonJscSafeUrlEncodedUrl,
  platforms,
) {
  if (!URL.canParse(rawNonJscSafeUrlEncodedUrl, RESOLVE_BASE_URL)) {
    throw new Error("Invalid URL", {
      cause: rawNonJscSafeUrlEncodedUrl,
    });
  }
  const {
    protocol: _tempProtocol,
    host,
    searchParams,
    pathname: requestPathname,
    search,
    hash,
  } = new URL(rawNonJscSafeUrlEncodedUrl, RESOLVE_BASE_URL);
  const isRelativeProtocol = rawNonJscSafeUrlEncodedUrl.startsWith("//");
  const protocolPart = isRelativeProtocol ? "//" : _tempProtocol + "//";
  const isNoProtocol = !isRelativeProtocol && protocolPart === RESOLVE_BASE_URL;
  if (isNoProtocol) {
    throw new Error(
      'Expecting the request url to have a valid protocol, e.g. "http://", "https://", or "//"',
      {
        cause: rawNonJscSafeUrlEncodedUrl,
      },
    );
  }
  const sourceUrl = jscSafeUrl.toJscSafeUrl(
    protocolPart + host + requestPathname + search + hash,
  );
  const pathname = searchParams.get("bundleEntry") || requestPathname || "";
  const platform =
    searchParams.get("platform") ||
    (0, _parsePlatformFilePath.default)(pathname, platforms).platform;
  const bundleType = getBundleType(
    _path.default.extname(pathname).substring(1),
  );
  const { pathname: sourceMapPathname } = new URL(
    pathname.replace(/\.(bundle|delta)$/, ".map"),
    RESOLVE_BASE_URL,
  );
  const sourceMapUrl = protocolPart + host + sourceMapPathname + search + hash;
  const filePathPosix = pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/")
    .replace(/^(?:\.?\/)?/, "./")
    .replace(/\.[^/.]+$/, "");
  debug(
    "Bundle options parsed from rawNonJscSafeUrlEncodedUrl:    %s:\nsourceUrl:    %s\nsourceMapUrl:    %s\nentryFile:    %s",
    rawNonJscSafeUrlEncodedUrl,
    sourceUrl,
    sourceMapUrl,
    filePathPosix,
  );
  return {
    bundleType,
    customResolverOptions: (0, _parseCustomResolverOptions.default)(
      searchParams,
    ),
    customTransformOptions: (0, _parseCustomTransformOptions.default)(
      searchParams,
    ),
    dev: getBoolQueryParam(searchParams, "dev", true),
    entryFile: filePathPosix,
    excludeSource: getBoolQueryParam(searchParams, "excludeSource", false),
    inlineSourceMap: getBoolQueryParam(searchParams, "inlineSourceMap", false),
    lazy: getBoolQueryParam(searchParams, "lazy", false),
    minify: getBoolQueryParam(searchParams, "minify", false),
    modulesOnly: getBoolQueryParam(searchParams, "modulesOnly", false),
    onProgress: null,
    platform,
    runModule: getBoolQueryParam(searchParams, "runModule", true),
    shallow: getBoolQueryParam(searchParams, "shallow", false),
    sourceMapUrl,
    sourcePaths:
      _types.SourcePathsMode.cast(searchParams.get("sourcePaths")) ??
      _types.SourcePathsMode.Absolute,
    sourceUrl,
    unstable_transformProfile: getTransformProfile(
      searchParams.get("unstable_transformProfile"),
    ),
  };
}
