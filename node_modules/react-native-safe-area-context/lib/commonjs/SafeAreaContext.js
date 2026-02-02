"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaInsetsContext = exports.SafeAreaFrameContext = exports.SafeAreaContext = exports.SafeAreaConsumer = void 0;
exports.SafeAreaListener = SafeAreaListener;
exports.SafeAreaProvider = SafeAreaProvider;
exports.useSafeArea = useSafeArea;
exports.useSafeAreaFrame = useSafeAreaFrame;
exports.useSafeAreaInsets = useSafeAreaInsets;
exports.withSafeAreaInsets = withSafeAreaInsets;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _NativeSafeAreaProvider = require("./NativeSafeAreaProvider");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const isDev = process.env.NODE_ENV !== 'production';
const SafeAreaInsetsContext = exports.SafeAreaInsetsContext = /*#__PURE__*/React.createContext(null);
if (isDev) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
}
const SafeAreaFrameContext = exports.SafeAreaFrameContext = /*#__PURE__*/React.createContext(null);
if (isDev) {
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}
function SafeAreaProvider({
  children,
  initialMetrics,
  initialSafeAreaInsets,
  style,
  ...others
}) {
  const parentInsets = useParentSafeAreaInsets();
  const parentFrame = useParentSafeAreaFrame();
  const [insets, setInsets] = React.useState(initialMetrics?.insets ?? initialSafeAreaInsets ?? parentInsets ?? null);
  const [frame, setFrame] = React.useState(initialMetrics?.frame ?? parentFrame ?? {
    // Backwards compat so we render anyway if we don't have frame.
    x: 0,
    y: 0,
    width: _reactNative.Dimensions.get('window').width,
    height: _reactNative.Dimensions.get('window').height
  });
  const onInsetsChange = React.useCallback(event => {
    const {
      nativeEvent: {
        frame: nextFrame,
        insets: nextInsets
      }
    } = event;
    setFrame(curFrame => {
      if (
      // Backwards compat with old native code that won't send frame.
      nextFrame && (nextFrame.height !== curFrame.height || nextFrame.width !== curFrame.width || nextFrame.x !== curFrame.x || nextFrame.y !== curFrame.y)) {
        return nextFrame;
      } else {
        return curFrame;
      }
    });
    setInsets(curInsets => {
      if (!curInsets || nextInsets.bottom !== curInsets.bottom || nextInsets.left !== curInsets.left || nextInsets.right !== curInsets.right || nextInsets.top !== curInsets.top) {
        return nextInsets;
      } else {
        return curInsets;
      }
    });
  }, []);
  return /*#__PURE__*/React.createElement(_NativeSafeAreaProvider.NativeSafeAreaProvider, _extends({
    style: [styles.fill, style],
    onInsetsChange: onInsetsChange
  }, others), insets != null ? /*#__PURE__*/React.createElement(SafeAreaFrameContext.Provider, {
    value: frame
  }, /*#__PURE__*/React.createElement(SafeAreaInsetsContext.Provider, {
    value: insets
  }, children)) : null);
}
function SafeAreaListener({
  onChange,
  style,
  children,
  ...others
}) {
  return /*#__PURE__*/React.createElement(_NativeSafeAreaProvider.NativeSafeAreaProvider, _extends({}, others, {
    style: [styles.fill, style],
    onInsetsChange: e => {
      onChange({
        insets: e.nativeEvent.insets,
        frame: e.nativeEvent.frame
      });
    }
  }), children);
}
const styles = _reactNative.StyleSheet.create({
  fill: {
    flex: 1
  }
});
function useParentSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}
function useParentSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}
const NO_INSETS_ERROR = 'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';
function useSafeAreaInsets() {
  const insets = React.useContext(SafeAreaInsetsContext);
  if (insets == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return insets;
}
function useSafeAreaFrame() {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}
function withSafeAreaInsets(WrappedComponent) {
  return /*#__PURE__*/React.forwardRef((props, ref) => {
    const insets = useSafeAreaInsets();
    return /*#__PURE__*/React.createElement(WrappedComponent, _extends({}, props, {
      insets: insets,
      ref: ref
    }));
  });
}

/**
 * @deprecated
 */
function useSafeArea() {
  return useSafeAreaInsets();
}

/**
 * @deprecated
 */
const SafeAreaConsumer = exports.SafeAreaConsumer = SafeAreaInsetsContext.Consumer;

/**
 * @deprecated
 */
const SafeAreaContext = exports.SafeAreaContext = SafeAreaInsetsContext;
//# sourceMappingURL=SafeAreaContext.js.map