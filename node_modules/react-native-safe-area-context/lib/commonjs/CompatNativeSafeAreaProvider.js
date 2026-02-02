"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompatNativeSafeAreaProvider = CompatNativeSafeAreaProvider;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function CompatNativeSafeAreaProvider({
  children,
  style,
  onInsetsChange
}) {
  const window = (0, _reactNative.useWindowDimensions)();
  React.useEffect(() => {
    const insets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    const frame = {
      x: 0,
      y: 0,
      width: window.width,
      height: window.height
    };
    // @ts-ignore: missing properties
    onInsetsChange({
      nativeEvent: {
        insets,
        frame
      }
    });
  }, [onInsetsChange, window.height, window.width]);
  return /*#__PURE__*/React.createElement(_reactNative.View, {
    style: style
  }, children);
}
//# sourceMappingURL=CompatNativeSafeAreaProvider.js.map