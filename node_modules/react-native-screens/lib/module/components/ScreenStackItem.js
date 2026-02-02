function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import warnOnce from 'warn-once';
import DebugContainer from './DebugContainer';
import { ScreenStackHeaderConfig } from './ScreenStackHeaderConfig';
import Screen from './Screen';
import ScreenStack from './ScreenStack';
import { RNSScreensRefContext } from '../contexts';
import { FooterComponent } from './ScreenFooter';
import SafeAreaView from './safe-area/SafeAreaView';
import { featureFlags } from '../flags';
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
  const screenRefs = React.useContext(RNSScreensRefContext);
  React.useImperativeHandle(ref, () => currentScreenRef.current);
  const stackPresentationWithDefault = stackPresentation ?? 'push';
  const headerConfigHiddenWithDefault = headerConfig?.hidden ?? false;
  const isHeaderInModal = Platform.OS === 'android' ? false : stackPresentationWithDefault !== 'push' && headerConfigHiddenWithDefault === false;
  const headerHiddenPreviousRef = React.useRef(headerConfigHiddenWithDefault);
  React.useEffect(() => {
    warnOnce(Platform.OS !== 'android' && stackPresentationWithDefault !== 'push' && headerHiddenPreviousRef.current !== headerConfigHiddenWithDefault, `Dynamically changing header's visibility in modals will result in remounting the screen and losing all local state.`);
    headerHiddenPreviousRef.current = headerConfigHiddenWithDefault;
  }, [headerConfigHiddenWithDefault, stackPresentationWithDefault]);
  const hasEdgeEffects = rest?.scrollEdgeEffects === undefined || Object.values(rest.scrollEdgeEffects).some(propValue => propValue !== 'hidden');
  const hasBlurEffect = headerConfig?.blurEffect !== undefined && headerConfig.blurEffect !== 'none';
  warnOnce(hasEdgeEffects && hasBlurEffect && Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 26, '[RNScreens] Using both `blurEffect` and `scrollEdgeEffects` simultaneously may cause overlapping effects.');
  const debugContainerStyle = getPositioningStyle(sheetAllowedDetents, stackPresentationWithDefault);

  // For iOS, we need to extract background color and apply it to Screen
  // due to the safe area inset at the bottom of ScreenContentWrapper
  let internalScreenStyle;
  if (stackPresentationWithDefault === 'formSheet' && Platform.OS === 'ios' && contentStyle) {
    const {
      screenStyles,
      contentWrapperStyles
    } = extractScreenStyles(contentStyle);
    internalScreenStyle = screenStyles;
    contentStyle = contentWrapperStyles;
  }
  const shouldUseSafeAreaView = Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 26;
  const content = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(DebugContainer, {
    contentStyle: contentStyle,
    style: debugContainerStyle,
    stackPresentation: stackPresentationWithDefault
  }, shouldUseSafeAreaView ? /*#__PURE__*/React.createElement(SafeAreaView, {
    edges: getSafeAreaEdges(headerConfig)
  }, children) : children), /*#__PURE__*/React.createElement(ScreenStackHeaderConfig, headerConfig), stackPresentationWithDefault === 'formSheet' && unstable_sheetFooter && /*#__PURE__*/React.createElement(FooterComponent, null, unstable_sheetFooter()));
  return /*#__PURE__*/React.createElement(Screen, _extends({
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
  }, rest), isHeaderInModal ? /*#__PURE__*/React.createElement(ScreenStack, {
    style: styles.container
  }, /*#__PURE__*/React.createElement(Screen, {
    enabled: true,
    isNativeStack: true,
    activityState: activityState,
    shouldFreeze: shouldFreeze,
    hasLargeHeader: headerConfig?.largeTitle ?? false,
    style: StyleSheet.absoluteFill,
    onHeaderHeightChange: onHeaderHeightChange
  }, content)) : content);
}
export default /*#__PURE__*/React.forwardRef(ScreenStackItem);
function getPositioningStyle(allowedDetents, presentation) {
  const isIOS = Platform.OS === 'ios';
  const rnMinorVersion = Platform.constants.reactNativeVersion.minor;
  if (presentation !== 'formSheet') {
    return styles.container;
  }
  if (isIOS) {
    if (allowedDetents !== 'fitToContents' && rnMinorVersion >= 82 && featureFlags.experiment.synchronousScreenUpdatesEnabled) {
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
  const flatStyle = StyleSheet.flatten(style);
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
  if (Platform.OS !== 'ios' || parseInt(Platform.Version, 10) < 26) {
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
const styles = StyleSheet.create({
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