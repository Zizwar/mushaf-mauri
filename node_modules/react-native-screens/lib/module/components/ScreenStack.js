'use client';

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { GHContext, RNSScreensRefContext } from '../contexts';
import warnOnce from 'warn-once';

// Native components
import ScreenStackNativeComponent from '../fabric/ScreenStackNativeComponent';
import featureFlags from '../flags';
const assertGHProvider = (ScreenGestureDetector, goBackGesture) => {
  const isGestureDetectorProviderNotDetected = ScreenGestureDetector.name !== 'GHWrapper' && goBackGesture !== undefined;
  warnOnce(isGestureDetectorProviderNotDetected, 'Cannot detect GestureDetectorProvider in a screen that uses `goBackGesture`. Make sure your navigator is wrapped in GestureDetectorProvider.');
};
const assertCustomScreenTransitionsProps = (screensRefs, currentScreenId, goBackGesture) => {
  const isGestureDetectorNotConfiguredProperly = goBackGesture !== undefined && screensRefs === null && currentScreenId === undefined;
  warnOnce(isGestureDetectorNotConfiguredProperly, 'Custom Screen Transition require screensRefs and currentScreenId to be provided.');
};
function ScreenStack(props) {
  const {
    goBackGesture,
    screensRefs: passedScreenRefs,
    // TODO: For compatibility with v5, remove once v5 is removed
    currentScreenId,
    transitionAnimation,
    screenEdgeGesture,
    nativeContainerStyle,
    onFinishTransitioning,
    children,
    ...rest
  } = props;
  const screensRefs = React.useRef(passedScreenRefs?.current ?? {});
  const ref = React.useRef(null);
  const ScreenGestureDetector = React.useContext(GHContext);
  const gestureDetectorBridge = React.useRef({
    stackUseEffectCallback: _stackRef => {
      // this method will be overriden in GestureDetector
    }
  });
  React.useEffect(() => {
    gestureDetectorBridge.current.stackUseEffectCallback(ref);
  });
  assertGHProvider(ScreenGestureDetector, goBackGesture);
  assertCustomScreenTransitionsProps(screensRefs, currentScreenId, goBackGesture);
  return /*#__PURE__*/React.createElement(RNSScreensRefContext.Provider, {
    value: screensRefs
  }, /*#__PURE__*/React.createElement(ScreenGestureDetector, {
    gestureDetectorBridge: gestureDetectorBridge,
    goBackGesture: goBackGesture,
    transitionAnimation: transitionAnimation,
    screenEdgeGesture: screenEdgeGesture ?? false,
    screensRefs: screensRefs,
    currentScreenId: currentScreenId
  }, /*#__PURE__*/React.createElement(ScreenStackNativeComponent, _extends({}, rest, {
    /**
     * This flag is temporary, for ensuring that we're not breaking any basic flow just
     * before Expo SDK release, we may consider removing it after releasing
     * react-native-screens@4.21.
     */
    iosPreventReattachmentOfDismissedScreens: featureFlags.experiment.iosPreventReattachmentOfDismissedScreens,
    iosPreventReattachmentOfDismissedModals: featureFlags.experiment.iosPreventReattachmentOfDismissedModals,
    nativeContainerBackgroundColor: nativeContainerStyle?.backgroundColor
    /**
     * This messy override is to conform NativeProps used by codegen and
     * our Public API. To see reasoning go to this PR:
     * https://github.com/software-mansion/react-native-screens/pull/2423#discussion_r1810616995
     */,
    onFinishTransitioning: onFinishTransitioning,
    ref: ref
  }), children)));
}
export default ScreenStack;
//# sourceMappingURL=ScreenStack.js.map