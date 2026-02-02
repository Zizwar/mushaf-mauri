"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _StackHostNativeComponent = _interopRequireDefault(require("../../../fabric/gamma/stack/StackHostNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function StackHost({
  children,
  ref
}) {
  return /*#__PURE__*/_react.default.createElement(_StackHostNativeComponent.default, {
    ref: ref,
    style: styles.container
  }, children);
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
var _default = exports.default = StackHost;
//# sourceMappingURL=StackHost.js.map