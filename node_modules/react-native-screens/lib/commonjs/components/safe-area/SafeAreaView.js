"use strict";
// Implementation adapted from `react-native-safe-area-context`:
// https://github.com/AppAndFlow/react-native-safe-area-context/blob/v5.6.1/src/SafeAreaView.tsx
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _SafeAreaViewNativeComponent = _interopRequireDefault(require("../../fabric/safe-area/SafeAreaViewNativeComponent"));
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SafeAreaView(props) {
  return /*#__PURE__*/_react.default.createElement(_SafeAreaViewNativeComponent.default, _extends({}, props, {
    style: [styles.flex, props.style],
    edges: getNativeEdgesProp(props.edges)
  }));
}
var _default = exports.default = SafeAreaView;
function getNativeEdgesProp(edges) {
  return {
    top: false,
    bottom: false,
    left: false,
    right: false,
    ...edges
  };
}
const styles = _reactNative.StyleSheet.create({
  flex: {
    flex: 1
  }
});
//# sourceMappingURL=SafeAreaView.js.map