"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports.default = void 0;
var _StackHost = _interopRequireDefault(require("./StackHost"));
var _StackScreen = _interopRequireDefault(require("./StackScreen"));
var _StackHost2 = require("./StackHost.types");
Object.keys(_StackHost2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _StackHost2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _StackHost2[key];
    }
  });
});
var _StackScreen2 = require("./StackScreen.types");
Object.keys(_StackScreen2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _StackScreen2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _StackScreen2[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
const Stack = {
  Host: _StackHost.default,
  Screen: _StackScreen.default
};
var _default = exports.default = Stack;
//# sourceMappingURL=index.js.map