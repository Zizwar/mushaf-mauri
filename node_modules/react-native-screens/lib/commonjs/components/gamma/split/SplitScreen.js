"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _SplitViewScreenNativeComponent = _interopRequireDefault(require("../../../fabric/gamma/SplitViewScreenNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function Column(props) {
  return /*#__PURE__*/_react.default.createElement(_SplitViewScreenNativeComponent.default, _extends({
    columnType: "column"
  }, props, {
    style: _reactNative.StyleSheet.absoluteFill
  }), props.children);
}

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function Inspector(props) {
  return /*#__PURE__*/_react.default.createElement(_SplitViewScreenNativeComponent.default, _extends({
    columnType: "inspector"
  }, props, {
    style: _reactNative.StyleSheet.absoluteFill
  }), props.children);
}

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
// TODO: refactor to drop `Screen` suffix as the API name is really long at the moment
const SplitScreen = {
  Column,
  Inspector
};
var _default = exports.default = SplitScreen;
//# sourceMappingURL=SplitScreen.js.map