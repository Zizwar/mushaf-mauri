"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Commands = void 0;
var _reactNative = require("react-native");
// eslint-disable-next-line @typescript-eslint/ban-types

const Commands = exports.Commands = (0, _reactNative.codegenNativeCommands)({
  supportedCommands: ['blur', 'focus', 'clearText', 'toggleCancelButton', 'setText', 'cancelSearch']
});
var _default = exports.default = (0, _reactNative.codegenNativeComponent)('RNSSearchBar', {});
//# sourceMappingURL=SearchBarNativeComponent.js.map