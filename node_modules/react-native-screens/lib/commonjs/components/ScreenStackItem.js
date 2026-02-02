"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _warnOnce = _interopRequireDefault(require("warn-once"));
var _DebugContainer = _interopRequireDefault(require("./DebugContainer"));
var _ScreenStackHeaderConfig = require("./ScreenStackHeaderConfig");
var _Screen = _interopRequireDefault(require("./Screen"));
var _ScreenStack = _interopRequireDefault(require("./ScreenStack"));
var _contexts = require("../contexts");
var _ScreenFooter = require("./ScreenFooter");
var _SafeAreaView = _interopRequireDefault(require("./safe-area/SafeAreaView"));
var _flags = require("../flags");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ScreenStackItem({
  children,
  headerConfig,
  activityState,
  shouldFreeze,
  stackPresentation,
  sheetAllowedDetents,
  contentStyle,
  style,
  screenId,
  onHeaderHeightChange,
  // eslint-disable-next-line camelcase
  unstable_sheetFooter,
  ...rest
}, ref) {
  const currentScreenRef = React.useRef(null);
  const screenRefs = React.useContext(_contexts.RNSScreensRefContext);
  React.useImperativeHandle(ref, () => currentScreenRef.current);
  const stackPresentationWithDefault = stackPresentation ?? 'push';
  const headerConfigHiddenWithDefault = headerConfig?.hidden ?? false;
  const isHeaderInModal = _reactNative.Platform.OS === 'android' ? false : stackPresentationWithDefault !== 'push' && headerConfigHiddenWithDefault === false;
  const headerHiddenPreviousRef = React.useRef(headerConfigHiddenWithDefault);
  React.useEffect(() => {
    (0, _warnOnce.default)(_reactNative.Platform.OS !== 'android' && stackPresentationWithDefault !== 'push' && headerHiddenPreviousRef.current !== headerConfigHiddenWithDefault, `Dynamically changing header's visibility in modals will result in remounting the screen and losing all local state.`);
    headerHiddenPreviousRef.current = headerConfigHiddenWithDefault;
  }, [headerConfigHiddenWithDefault, stackPresentationWithDefault]);
  const hasEdgeEffects = rest?.scrollEdgeEffects === undefined || Object.values(rest.scrollEdgeEffects).some(propValue => propValue !== 'hidden');
  const hasBlurEffect = headerConfig?.blurEffect !== undefined && headerConfig.blurEffect !== 'none';
  (0, _warnOnce.default)(hasEdgeEffects && hasBlurEffect && _reactNative.Platform.OS === 'ios' && parseInt(_reactNative.Platform.Version, 10) >= 26, '[RNScreens] Using both `blurEffect` and `scrollEdgeEffects` simultaneously may cause overlapping effects.');
  const debugContainerStyle = getPositioningStyle(sheetAllowedDetents, stackPresentationWithDefault);

  // For iOS, we need to extract background color and apply it to Screen
  // due to the safe area inset at the bottom of ScreenContentWrapper
  let internalScreenStyle;
  if (stackPresentationWithDefault === 'formSheet' && _reactNative.Platform.OS === 'ios' && contentStyle) {
    const {
      screenStyles,
      contentWrapperStyles
    } = extractScreenStyles(contentStyle);
    internalScreenStyle = screenStyles;
    contentStyle = contentWrapperStyles;
  }
  const shouldUseSafeAreaView = _reactNative.Platform.OS === 'ios' && parseInt(_reactNative.Platform.Version, 10) >= 26;
  const content = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(_DebugContainer.default, {
    contentStyle: contentStyle,
    style: debugContainerStyle,
    stackPresentation: stackPresentationWithDefault
  }, shouldUseSafeAreaView ? /*#__PURE__*/React.createElement(_SafeAreaView.default, {
    edges: getSafeAreaEdges(headerConfig)
  }, children) : children), /*#__PURE__*/React.createElement(_ScreenStackHeaderConfig.ScreenStackHeaderConfig, headerConfig), stackPresentationWithDefault === 'formSheet' && unstable_sheetFooter && /*#__PURE__*/React.createElement(_ScreenFooter.FooterComponent, null, unstable_sheetFooter()));
  return /*#__PURE__*/React.createElement(_Screen.default, _extends({
    ref: node => {
      currentScreenRef.current = node;
      if (screenRefs === null) {
        console.warn('Looks like RNSScreensRefContext is missing. Make sure the ScreenStack component is wrapped in it');
        return;
      }
      const currentRefs = screenRefs.current;
      if (node === null) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete currentRefs[screenId];
      } else {
        currentRefs[screenId] = {
          current: node
        };
      }
    },
    enabled: true,
    isNativeStack: true,
    activityState: activityState,
    shouldFreeze: shouldFreeze,
    screenId: screenId,
    stackPresentation: stackPresentationWithDefault,
    hasLargeHeader: headerConfig?.largeTitle ?? false,
    sheetAllowedDetents: sheetAllowedDetents,
    style: [style, internalScreenStyle],
    onHeaderHeightChange: isHeaderInModal ? undefined : onHeaderHeightChange
  }, rest), isHeaderInModal ? /*#__PURE__*/React.createElement(_ScreenStack.default, {
    style: styles.container
  }, /*#__PURE__*/React.createElement(_Screen.default, {
    enabled: true,
    isNativeStack: true,
    activityState: activityState,
    shouldFreeze: shouldFreeze,
    hasLargeHeader: headerConfig?.largeTitle ?? false,
    style: _reactNative.StyleSheet.absoluteFill,
    onHeaderHeightChange: onHeaderHeightChange
  }, content)) : content);
}
var _default = exports.default = /*#__PURE__*/React.forwardRef(ScreenStackItem);
function getPositioningStyle(allowedDetents, presentation) {
  const isIOS = _reactNative.Platform.OS === 'ios';
  const rnMinorVersion = _reactNative.Platform.constants.reactNativeVersion.minor;
  if (presentation !== 'formSheet') {
    return styles.container;
  }
  if (isIOS) {
    if (allowedDetents !== 'fitToContents' && rnMinorVersion >= 82 && _flags.featureFlags.experiment.synchronousScreenUpdatesEnabled) {
      return styles.container;
    } else {
      return styles.absoluteWithNoBottom;
    }
  }

  /**
   * Note: `bottom: 0` is intentionally excluded from these styles for two reasons:
   *
   * 1. Omitting the bottom constraint ensures the Yoga layout engine does not dynamically
   * recalculate the Screen and content size during animations.
   *
   * 2. Including `bottom: 0` with 'position: absolute' would force
   * the component to anchor itself to an ancestor's bottom edge. This creates
   * a dependency on the ancestor's size, whereas 'fitToContents' requires the
   * FormSheet's dimensions to be derived strictly from its children.
   *
   * It was tested reliably only on Android.
   */
  if (allowedDetents === 'fitToContents') {
    return styles.absoluteWithNoBottom;
  }
  return styles.container;
}
// TODO: figure out whether other styles, like borders, filters, etc.
// shouldn't be applied on the Screen level on iOS due to the inset.
function extractScreenStyles(style) {
  const flatStyle = _reactNative.StyleSheet.flatten(style);
  const {
    backgroundColor,
    ...contentWrapperStyles
  } = flatStyle;
  const screenStyles = {
    backgroundColor
  };
  return {
    screenStyles,
    contentWrapperStyles
  };
}
function getSafeAreaEdges(headerConfig) {
  if (_reactNative.Platform.OS !== 'ios' || parseInt(_reactNative.Platform.Version, 10) < 26) {
    return {};
  }
  let defaultEdges;
  if (headerConfig?.translucent || headerConfig?.hidden) {
    defaultEdges = {};
  } else {
    defaultEdges = {
      top: true
    };
  }
  return defaultEdges;
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  },
  absoluteWithNoBottom: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0
  }
});
//# sourceMappingURL=ScreenStackItem.js.map