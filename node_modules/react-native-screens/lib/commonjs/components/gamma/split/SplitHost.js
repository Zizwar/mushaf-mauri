"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _SplitHostNativeComponent = _interopRequireWildcard(require("../../../fabric/gamma/split/SplitHostNativeComponent"));
var _SplitScreen = _interopRequireDefault(require("./SplitScreen"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// According to the UIKit documentation: https://developer.apple.com/documentation/uikit/uisplitviewcontroller/displaymode-swift.enum
// Only specific pairs for displayMode - splitBehavior are valid and others may lead to unexpected results.
// Therefore, we're adding check on the JS side to return a feedback to the client when that pairing isn't valid.
// However, we're not blocking these props to be set on the native side, because it doesn't crash, just the result or transitions may not work as expected.
const displayModeForSplitCompatibilityMap = {
  tile: ['secondaryOnly', 'oneBesideSecondary', 'twoBesideSecondary'],
  overlay: ['secondaryOnly', 'oneOverSecondary', 'twoOverSecondary'],
  displace: ['secondaryOnly', 'oneBesideSecondary', 'twoDisplaceSecondary'],
  automatic: [] // placeholder for satisfying types; we'll handle it specially in logic
};
const isValidDisplayModeForSplitBehavior = (displayMode, splitBehavior) => {
  if (splitBehavior === 'automatic') {
    // for automatic we cannot easily verify the compatibility, because it depends on the system preference for display mode, therefore we're assuming that 'automatic' has only valid combinations
    return true;
  }
  return displayModeForSplitCompatibilityMap[splitBehavior].includes(displayMode);
};

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function SplitHost({
  ref,
  ...props
}) {
  const {
    preferredDisplayMode,
    preferredSplitBehavior
  } = props;
  const nativeRef = _react.default.useRef(null);
  _react.default.useImperativeHandle(ref, () => ({
    show: column => {
      if (nativeRef.current) {
        _SplitHostNativeComponent.Commands.showColumn(nativeRef.current, column);
      } else {
        console.warn('[RNScreens] Reference to native SplitHost component has not been updated yet');
      }
    }
  }), []);
  _react.default.useEffect(() => {
    if (preferredDisplayMode && preferredSplitBehavior) {
      const isValid = isValidDisplayModeForSplitBehavior(preferredDisplayMode, preferredSplitBehavior);
      if (!isValid) {
        const validDisplayModes = displayModeForSplitCompatibilityMap[preferredSplitBehavior];
        console.warn(`Invalid display mode "${preferredDisplayMode}" for split behavior "${preferredSplitBehavior}".` + `\nValid modes for "${preferredSplitBehavior}" are: ${validDisplayModes.join(', ')}.`);
      }
    }
  }, [preferredDisplayMode, preferredSplitBehavior]);
  const children = _react.default.Children.toArray(props.children);
  const columns = children.filter(
  // @ts-ignore - type is valid attribute for child
  child => child.type === _SplitScreen.default.Column);
  const inspectors = children.filter(
  // @ts-ignore - type is valid attribute for child
  child => child.type === _SplitScreen.default.Inspector);
  return /*#__PURE__*/_react.default.createElement(_SplitHostNativeComponent.default, _extends({
    ref: nativeRef
    // UISplitViewController requires the number of columns to be specified at initialization and it cannot be changed dynamically later.
    // By using a specific key in this form, we can detect changes in the number of React children.
    // This enables us to fully recreate the Split when necessary, ensuring the correct column configuration is always applied.
    ,
    key: `columns-${columns.length}-inspectors-${inspectors.length}`
  }, props, {
    style: styles.container
  }), props.children);
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
var _default = exports.default = SplitHost;
//# sourceMappingURL=SplitHost.js.map