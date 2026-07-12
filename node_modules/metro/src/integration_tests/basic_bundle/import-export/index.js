"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.asyncImportMaybeSyncESM =
  exports.asyncImportMaybeSyncCJS =
  exports.asyncImportESM =
  exports.asyncImportCJS =
    void 0;
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _export4.foo;
  },
});
exports.extraData = void 0;
Object.defineProperty(exports, "namedDefaultExported", {
  enumerable: true,
  get: function () {
    return _export3.default;
  },
});
var _export = _interopRequireWildcard(require("./export-1"));
var importStar = _interopRequireWildcard(require("./export-2"));
var _exportNull = require("./export-null");
var _exportPrimitiveDefault = _interopRequireWildcard(
  require("./export-primitive-default"),
);
var _export3 = _interopRequireDefault(require("./export-3"));
var _export4 = require("./export-4");
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
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
const extraData = (exports.extraData = {
  foo: _exportNull.foo,
  importStar,
  myDefault: _export.default,
  myFoo: _export.foo,
  myFunction: (0, _export.myFunction)(),
  primitiveDefault: _exportPrimitiveDefault.default,
  primitiveFoo: _exportPrimitiveDefault.foo,
});
const asyncImportCJS = (exports.asyncImportCJS = import("./export-5"));
const asyncImportESM = (exports.asyncImportESM = import("./export-6"));
const asyncImportMaybeSyncCJS = (exports.asyncImportMaybeSyncCJS =
  require.unstable_importMaybeSync("./export-7"));
const asyncImportMaybeSyncESM = (exports.asyncImportMaybeSyncESM =
  require.unstable_importMaybeSync("./export-8"));
