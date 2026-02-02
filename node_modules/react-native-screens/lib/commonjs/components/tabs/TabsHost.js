"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _BottomTabsNativeComponent = _interopRequireDefault(require("../../fabric/bottom-tabs/BottomTabsNativeComponent"));
var _flags = _interopRequireDefault(require("../../flags"));
var _logging = require("../../private/logging");
var _TabsAccessory = _interopRequireDefault(require("./TabsAccessory"));
var _TabsAccessoryContent = _interopRequireDefault(require("./TabsAccessoryContent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function TabsHost(props) {
  (0, _logging.bottomTabsDebugLog)(`TabsHost render`);
  const {
    onNativeFocusChange,
    experimentalControlNavigationStateInJS = _flags.default.experiment.controlledBottomTabs,
    bottomAccessory,
    nativeContainerStyle,
    ...filteredProps
  } = props;
  const componentNodeRef = _react.default.useRef(null);
  const componentNodeHandle = _react.default.useRef(-1);
  _react.default.useEffect(() => {
    if (componentNodeRef.current != null) {
      componentNodeHandle.current = (0, _reactNative.findNodeHandle)(componentNodeRef.current) ?? -1;
    } else {
      componentNodeHandle.current = -1;
    }
  }, []);
  const onNativeFocusChangeCallback = _react.default.useCallback(event => {
    (0, _logging.bottomTabsDebugLog)(`TabsHost [${componentNodeHandle.current ?? -1}] onNativeFocusChange: ${JSON.stringify(event.nativeEvent)}`);
    onNativeFocusChange?.(event);
  }, [onNativeFocusChange]);
  const [bottomAccessoryEnvironment, setBottomAccessoryEnvironment] = (0, _react.useState)('regular');
  return /*#__PURE__*/_react.default.createElement(_BottomTabsNativeComponent.default, _extends({
    style: styles.fillParent,
    onNativeFocusChange: onNativeFocusChangeCallback,
    controlNavigationStateInJS: experimentalControlNavigationStateInJS,
    nativeContainerBackgroundColor: nativeContainerStyle?.backgroundColor
    // @ts-ignore suppress ref - debug only
    ,
    ref: componentNodeRef
  }, filteredProps), filteredProps.children, bottomAccessory && _reactNative.Platform.OS === 'ios' && parseInt(_reactNative.Platform.Version, 10) >= 26 && (_reactNative.Platform.constants.reactNativeVersion.minor >= 82 ? /*#__PURE__*/_react.default.createElement(_TabsAccessory.default, null, /*#__PURE__*/_react.default.createElement(_TabsAccessoryContent.default, {
    environment: "regular"
  }, bottomAccessory('regular')), /*#__PURE__*/_react.default.createElement(_TabsAccessoryContent.default, {
    environment: "inline"
  }, bottomAccessory('inline'))) : /*#__PURE__*/_react.default.createElement(_TabsAccessory.default, {
    onEnvironmentChange: event => {
      setBottomAccessoryEnvironment(event.nativeEvent.environment);
    }
  }, bottomAccessory(bottomAccessoryEnvironment))));
}
var _default = exports.default = TabsHost;
const styles = _reactNative.StyleSheet.create({
  fillParent: {
    flex: 1,
    width: '100%',
    height: '100%'
  }
});
//# sourceMappingURL=TabsHost.js.map