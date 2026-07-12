"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Split = void 0;
var _SplitHost = _interopRequireDefault(require("./SplitHost"));
var _SplitScreen = _interopRequireDefault(require("./SplitScreen"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
const Split = exports.Split = {
  Host: _SplitHost.default,
  Column: _SplitScreen.default.Column,
  Inspector: _SplitScreen.default.Inspector
};
//# sourceMappingURL=index.js.map