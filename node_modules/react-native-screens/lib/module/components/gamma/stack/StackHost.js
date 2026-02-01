import React from 'react';
import { StyleSheet } from 'react-native';
import StackHostNativeComponent from '../../../fabric/gamma/stack/StackHostNativeComponent';
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function StackHost({
  children,
  ref
}) {
  return /*#__PURE__*/React.createElement(StackHostNativeComponent, {
    ref: ref,
    style: styles.container
  }, children);
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
export default StackHost;
//# sourceMappingURL=StackHost.js.map