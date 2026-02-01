"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
// TODO: Report issue on RN repo, that nesting color value inside a struct does not work.
// Generated code is ok, but the value is not passed down correctly - whatever color is set
// host component receives RGBA(0, 0, 0, 0) anyway.
// type TabBarAppearance = {
//   backgroundColor?: ColorValue;
// };
var _default = exports.default = (0, _reactNative.codegenNativeComponent)('RNSBottomTabs', {
  interfaceOnly: true
});
//# sourceMappingURL=BottomTabsNativeComponent.js.map