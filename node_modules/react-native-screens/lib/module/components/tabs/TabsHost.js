'use client';

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React, { useState } from 'react';
import { Platform, StyleSheet, findNodeHandle } from 'react-native';
import BottomTabsNativeComponent from '../../fabric/bottom-tabs/BottomTabsNativeComponent';
import featureFlags from '../../flags';
import { bottomTabsDebugLog } from '../../private/logging';
import TabsAccessory from './TabsAccessory';
import TabsAccessoryContent from './TabsAccessoryContent';

/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function TabsHost(props) {
  bottomTabsDebugLog(`TabsHost render`);
  const {
    onNativeFocusChange,
    experimentalControlNavigationStateInJS = featureFlags.experiment.controlledBottomTabs,
    bottomAccessory,
    nativeContainerStyle,
    ...filteredProps
  } = props;
  const componentNodeRef = React.useRef(null);
  const componentNodeHandle = React.useRef(-1);
  React.useEffect(() => {
    if (componentNodeRef.current != null) {
      componentNodeHandle.current = findNodeHandle(componentNodeRef.current) ?? -1;
    } else {
      componentNodeHandle.current = -1;
    }
  }, []);
  const onNativeFocusChangeCallback = React.useCallback(event => {
    bottomTabsDebugLog(`TabsHost [${componentNodeHandle.current ?? -1}] onNativeFocusChange: ${JSON.stringify(event.nativeEvent)}`);
    onNativeFocusChange?.(event);
  }, [onNativeFocusChange]);
  const [bottomAccessoryEnvironment, setBottomAccessoryEnvironment] = useState('regular');
  return /*#__PURE__*/React.createElement(BottomTabsNativeComponent, _extends({
    style: styles.fillParent,
    onNativeFocusChange: onNativeFocusChangeCallback,
    controlNavigationStateInJS: experimentalControlNavigationStateInJS,
    nativeContainerBackgroundColor: nativeContainerStyle?.backgroundColor
    // @ts-ignore suppress ref - debug only
    ,
    ref: componentNodeRef
  }, filteredProps), filteredProps.children, bottomAccessory && Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 26 && (Platform.constants.reactNativeVersion.minor >= 82 ? /*#__PURE__*/React.createElement(TabsAccessory, null, /*#__PURE__*/React.createElement(TabsAccessoryContent, {
    environment: "regular"
  }, bottomAccessory('regular')), /*#__PURE__*/React.createElement(TabsAccessoryContent, {
    environment: "inline"
  }, bottomAccessory('inline'))) : /*#__PURE__*/React.createElement(TabsAccessory, {
    onEnvironmentChange: event => {
      setBottomAccessoryEnvironment(event.nativeEvent.environment);
    }
  }, bottomAccessory(bottomAccessoryEnvironment))));
}
export default TabsHost;
const styles = StyleSheet.create({
  fillParent: {
    flex: 1,
    width: '100%',
    height: '100%'
  }
});
//# sourceMappingURL=TabsHost.js.map