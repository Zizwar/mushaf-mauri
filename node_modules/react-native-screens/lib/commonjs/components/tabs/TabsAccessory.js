"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TabsAccessory;
var _react = _interopRequireDefault(require("react"));
var _BottomTabsAccessoryNativeComponent = _interopRequireDefault(require("../../fabric/bottom-tabs/BottomTabsAccessoryNativeComponent"));
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function TabsAccessory(props) {
  return /*#__PURE__*/_react.default.createElement(_BottomTabsAccessoryNativeComponent.default, _extends({}, props, {
    collapsable: false,
    style: [props.style, _reactNative.StyleSheet.absoluteFill]
  }));
}
//# sourceMappingURL=TabsAccessory.js.map