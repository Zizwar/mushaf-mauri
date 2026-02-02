"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _StackScreenNativeComponent = _interopRequireDefault(require("../../../fabric/gamma/stack/StackScreenNativeComponent"));
var _private = require("../../../private/");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function StackScreen({
  children,
  // Control
  activityMode,
  screenKey,
  // Events
  onWillAppear,
  onWillDisappear,
  onDidAppear,
  onDidDisappear,
  onDismiss,
  onNativeDismiss
}) {
  const onDismissWrapper = _react.default.useCallback(event => {
    if (event.nativeEvent.isNativeDismiss) {
      onNativeDismiss?.(screenKey);
    } else {
      onDismiss?.(screenKey);
    }
  }, [onDismiss, onNativeDismiss, screenKey]);
  const componentRef = (0, _private.useRenderDebugInfo)(_react.default.useMemo(() => `StackScreen (${screenKey})`, [screenKey]));
  return /*#__PURE__*/_react.default.createElement(_StackScreenNativeComponent.default
  // @ts-ignore - debug only
  , {
    ref: componentRef,
    style: _reactNative.StyleSheet.absoluteFill
    // Control
    ,
    activityMode: activityMode,
    screenKey: screenKey
    // Events
    ,
    onWillAppear: onWillAppear,
    onDidAppear: onDidAppear,
    onWillDisappear: onWillDisappear,
    onDidDisappear: onDidDisappear,
    onDismiss: onDismissWrapper
  }, children);
}
var _default = exports.default = StackScreen;
//# sourceMappingURL=StackScreen.js.map