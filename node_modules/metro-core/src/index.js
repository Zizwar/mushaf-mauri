"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
Object.defineProperty(exports, "AmbiguousModuleResolutionError", {
  enumerable: true,
  get: function () {
    return _AmbiguousModuleResolutionError.default;
  },
});
exports.Logger = void 0;
Object.defineProperty(exports, "PackageResolutionError", {
  enumerable: true,
  get: function () {
    return _PackageResolutionError.default;
  },
});
Object.defineProperty(exports, "Terminal", {
  enumerable: true,
  get: function () {
    return _Terminal.default;
  },
});
exports.default = void 0;
var _AmbiguousModuleResolutionError = _interopRequireDefault(
  require("./errors/AmbiguousModuleResolutionError"),
);
var _PackageResolutionError = _interopRequireDefault(
  require("./errors/PackageResolutionError"),
);
var Logger = _interopRequireWildcard(require("./Logger"));
exports.Logger = Logger;
var _Terminal = _interopRequireDefault(require("./Terminal"));
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
var _default = (exports.default = {
  AmbiguousModuleResolutionError: _AmbiguousModuleResolutionError.default,
  Logger,
  PackageResolutionError: _PackageResolutionError.default,
  Terminal: _Terminal.default,
});
