// Implementation adapted from `react-native-safe-area-context`:
// https://github.com/AppAndFlow/react-native-safe-area-context/blob/v5.6.1/src/SafeAreaView.tsx
'use client';

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import SafeAreaViewNativeComponent from '../../fabric/safe-area/SafeAreaViewNativeComponent';
import { StyleSheet } from 'react-native';
function SafeAreaView(props) {
  return /*#__PURE__*/React.createElement(SafeAreaViewNativeComponent, _extends({}, props, {
    style: [styles.flex, props.style],
    edges: getNativeEdgesProp(props.edges)
  }));
}
export default SafeAreaView;
function getNativeEdgesProp(edges) {
  return {
    top: false,
    bottom: false,
    left: false,
    right: false,
    ...edges
  };
}
const styles = StyleSheet.create({
  flex: {
    flex: 1
  }
});
//# sourceMappingURL=SafeAreaView.js.map