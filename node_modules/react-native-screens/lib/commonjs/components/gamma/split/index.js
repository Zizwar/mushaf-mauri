"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports.default = void 0;
var _SplitHost = _interopRequireDefault(require("./SplitHost"));
var _SplitScreen = _interopRequireDefault(require("./SplitScreen"));
var _SplitHost2 = require("./SplitHost.types");
Object.keys(_SplitHost2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _SplitHost2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _SplitHost2[key];
    }
  });
});
var _SplitScreen2 = require("./SplitScreen.types");
Object.keys(_SplitScreen2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _SplitScreen2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _SplitScreen2[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
const Split = {
  Host: _SplitHost.default,
  Column: _SplitScreen.default.Column,
  Inspector: _SplitScreen.default.Inspector
};
var _default = exports.default = Split;
//# sourceMappingURL=index.js.map