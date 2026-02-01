function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import { Platform } from 'react-native';
// @ts-expect-error importing private component

import AppContainer from 'react-native/Libraries/ReactNative/AppContainer';
import ScreenContentWrapper from './ScreenContentWrapper';
/**
 * This view must *not* be flattened.
 * See https://github.com/software-mansion/react-native-screens/pull/1825
 * for detailed explanation.
 */
let DebugContainer = ({
  contentStyle,
  style,
  ...rest
}) => {
  return /*#__PURE__*/React.createElement(ScreenContentWrapper, _extends({
    style: [style, contentStyle]
  }, rest));
};
if (process.env.NODE_ENV !== 'production') {
  DebugContainer = props => {
    const {
      contentStyle,
      stackPresentation,
      style,
      ...rest
    } = props;
    const content = /*#__PURE__*/React.createElement(ScreenContentWrapper, _extends({
      style: [style, contentStyle]
    }, rest));
    if (Platform.OS === 'ios' && stackPresentation !== 'push' && stackPresentation !== 'formSheet') {
      // This is necessary for LogBox
      return /*#__PURE__*/React.createElement(AppContainer, null, content);
    }
    return content;
  };
  DebugContainer.displayName = 'DebugContainer';
}
export default DebugContainer;
//# sourceMappingURL=DebugContainer.js.map