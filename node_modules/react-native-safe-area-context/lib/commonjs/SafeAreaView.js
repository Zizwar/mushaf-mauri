"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaView = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _NativeSafeAreaView = _interopRequireDefault(require("./specs/NativeSafeAreaView"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const defaultEdges = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive'
};
const SafeAreaView = exports.SafeAreaView = /*#__PURE__*/React.forwardRef(({
  edges,
  ...props
}, ref) => {
  const nativeEdges = (0, _react.useMemo)(() => {
    if (edges == null) {
      return defaultEdges;
    }
    const edgesObj = Array.isArray(edges) ? edges.reduce((acc, edge) => {
      acc[edge] = 'additive';
      return acc;
    }, {}) :
    // ts has trouble with refining readonly arrays.
    edges;

    // make sure that we always pass all edges, required for fabric
    const requiredEdges = {
      top: edgesObj.top ?? 'off',
      right: edgesObj.right ?? 'off',
      bottom: edgesObj.bottom ?? 'off',
      left: edgesObj.left ?? 'off'
    };
    return requiredEdges;
  }, [edges]);
  return /*#__PURE__*/React.createElement(_NativeSafeAreaView.default, _extends({}, props, {
    edges: nativeEdges,
    ref: ref
  }));
});
//# sourceMappingURL=SafeAreaView.js.map