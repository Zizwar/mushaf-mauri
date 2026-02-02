"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const NOOP = () => {
  console.warn('[RNScreens] Split component is supported only for iOS. Consider using an alternative layout for Android.');
  return null;
};
const Column = NOOP;
const Inspector = NOOP;
var _default = exports.default = {
  Column,
  Inspector
};
//# sourceMappingURL=SplitScreen.android.js.map