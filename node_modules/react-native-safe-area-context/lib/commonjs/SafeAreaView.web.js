"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaView = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _SafeAreaContext = require("./SafeAreaContext");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const defaultEdges = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive'
};
function getEdgeValue(inset, current, mode) {
  switch (mode) {
    case 'off':
      return current;
    case 'maximum':
      return Math.max(current, inset);
    case 'additive':
    default:
      return current + inset;
  }
}
const SafeAreaView = exports.SafeAreaView = /*#__PURE__*/React.forwardRef(({
  style = {},
  mode,
  edges,
  ...rest
}, ref) => {
  const insets = (0, _SafeAreaContext.useSafeAreaInsets)();
  const edgesRecord = React.useMemo(() => {
    if (edges == null) {
      return defaultEdges;
    }
    return Array.isArray(edges) ? edges.reduce((acc, edge) => {
      acc[edge] = 'additive';
      return acc;
    }, {}) :
    // ts has trouble with refining readonly arrays.
    edges;
  }, [edges]);
  const appliedStyle = React.useMemo(() => {
    const flatStyle = _reactNative.StyleSheet.flatten(style);
    if (mode === 'margin') {
      const {
        margin = 0,
        marginVertical = margin,
        marginHorizontal = margin,
        marginTop = marginVertical,
        marginRight = marginHorizontal,
        marginBottom = marginVertical,
        marginLeft = marginHorizontal
      } = flatStyle;
      const marginStyle = {
        marginTop: getEdgeValue(insets.top, marginTop, edgesRecord.top),
        marginRight: getEdgeValue(insets.right, marginRight, edgesRecord.right),
        marginBottom: getEdgeValue(insets.bottom, marginBottom, edgesRecord.bottom),
        marginLeft: getEdgeValue(insets.left, marginLeft, edgesRecord.left)
      };
      return [style, marginStyle];
    } else {
      const {
        padding = 0,
        paddingVertical = padding,
        paddingHorizontal = padding,
        paddingTop = paddingVertical,
        paddingRight = paddingHorizontal,
        paddingBottom = paddingVertical,
        paddingLeft = paddingHorizontal
      } = flatStyle;
      const paddingStyle = {
        paddingTop: getEdgeValue(insets.top, paddingTop, edgesRecord.top),
        paddingRight: getEdgeValue(insets.right, paddingRight, edgesRecord.right),
        paddingBottom: getEdgeValue(insets.bottom, paddingBottom, edgesRecord.bottom),
        paddingLeft: getEdgeValue(insets.left, paddingLeft, edgesRecord.left)
      };
      return [style, paddingStyle];
    }
  }, [edgesRecord.bottom, edgesRecord.left, edgesRecord.right, edgesRecord.top, insets.bottom, insets.left, insets.right, insets.top, mode, style]);
  return /*#__PURE__*/React.createElement(_reactNative.View, _extends({
    style: appliedStyle
  }, rest, {
    ref: ref
  }));
});
//# sourceMappingURL=SafeAreaView.web.js.map