function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { StyleSheet } from 'react-native';
import SplitViewScreenNativeComponent from '../../../fabric/gamma/SplitViewScreenNativeComponent';
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function Column(props) {
  return /*#__PURE__*/React.createElement(SplitViewScreenNativeComponent, _extends({
    columnType: "column"
  }, props, {
    style: StyleSheet.absoluteFill
  }), props.children);
}

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function Inspector(props) {
  return /*#__PURE__*/React.createElement(SplitViewScreenNativeComponent, _extends({
    columnType: "inspector"
  }, props, {
    style: StyleSheet.absoluteFill
  }), props.children);
}

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
// TODO: refactor to drop `Screen` suffix as the API name is really long at the moment
const SplitScreen = {
  Column,
  Inspector
};
export default SplitScreen;
//# sourceMappingURL=SplitScreen.js.map