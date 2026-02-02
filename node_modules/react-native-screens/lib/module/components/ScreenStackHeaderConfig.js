'use client';

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { Image, Platform, StyleSheet } from 'react-native';
import featureFlags from '../flags';

// Native components
import ScreenStackHeaderConfigNativeComponent from '../fabric/ScreenStackHeaderConfigNativeComponent';
import ScreenStackHeaderSubviewNativeComponent from '../fabric/ScreenStackHeaderSubviewNativeComponent';
import { prepareHeaderBarButtonItems } from './helpers/prepareHeaderBarButtonItems';
import { isHeaderBarButtonsAvailableForCurrentPlatform } from '../utils';
export const ScreenStackHeaderSubview = ScreenStackHeaderSubviewNativeComponent;
export const ScreenStackHeaderConfig = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    headerLeftBarButtonItems,
    headerRightBarButtonItems
  } = props;
  const preparedHeaderLeftBarButtonItems = headerLeftBarButtonItems && isHeaderBarButtonsAvailableForCurrentPlatform ? prepareHeaderBarButtonItems(headerLeftBarButtonItems, 'left') : undefined;
  const preparedHeaderRightBarButtonItems = headerRightBarButtonItems && isHeaderBarButtonsAvailableForCurrentPlatform ? prepareHeaderBarButtonItems(headerRightBarButtonItems, 'right') : undefined;
  const hasHeaderBarButtonItems = isHeaderBarButtonsAvailableForCurrentPlatform && (preparedHeaderLeftBarButtonItems?.length || preparedHeaderRightBarButtonItems?.length);

  // Handle bar button item presses
  const onPressHeaderBarButtonItem = hasHeaderBarButtonItems ? event => {
    const pressedItem = [...(preparedHeaderLeftBarButtonItems ?? []), ...(preparedHeaderRightBarButtonItems ?? [])].find(item => item && 'buttonId' in item && item.buttonId === event.nativeEvent.buttonId);
    if (pressedItem && pressedItem.type === 'button' && pressedItem.onPress) {
      pressedItem.onPress();
    }
  } : undefined;

  // Handle bar button menu item presses by deep-searching nested menus
  const onPressHeaderBarButtonMenuItem = hasHeaderBarButtonItems ? event => {
    // Recursively search menu tree
    const findInMenu = (menu, menuId) => {
      for (const item of menu.items) {
        if ('items' in item) {
          // submenu: recurse
          const found = findInMenu(item, menuId);
          if (found) {
            return found;
          }
        } else if ('menuId' in item && item.menuId === menuId) {
          return item;
        }
      }
      return undefined;
    };

    // Check each bar-button item with a menu
    const allItems = [...(preparedHeaderLeftBarButtonItems ?? []), ...(preparedHeaderRightBarButtonItems ?? [])];
    for (const item of allItems) {
      if (item && item.type === 'menu' && item.menu) {
        const action = findInMenu(item.menu, event.nativeEvent.menuId);
        if (action) {
          action.onPress();
          return;
        }
      }
    }
  } : undefined;
  return /*#__PURE__*/React.createElement(ScreenStackHeaderConfigNativeComponent, _extends({}, props, {
    userInterfaceStyle: props.experimental_userInterfaceStyle,
    headerLeftBarButtonItems: preparedHeaderLeftBarButtonItems,
    headerRightBarButtonItems: preparedHeaderRightBarButtonItems,
    onPressHeaderBarButtonItem: onPressHeaderBarButtonItem,
    onPressHeaderBarButtonMenuItem: onPressHeaderBarButtonMenuItem,
    ref: ref,
    style: styles.headerConfig,
    pointerEvents: "box-none",
    synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderConfigUpdatesEnabled
  }));
});
ScreenStackHeaderConfig.displayName = 'ScreenStackHeaderConfig';
export const ScreenStackHeaderBackButtonImage = props => /*#__PURE__*/React.createElement(ScreenStackHeaderSubview, {
  type: "back",
  style: styles.headerSubview,
  synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled
}, /*#__PURE__*/React.createElement(Image, _extends({
  resizeMode: "center",
  fadeDuration: 0
}, props)));
export const ScreenStackHeaderRightView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/React.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "right",
    synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubview, style]
  }));
};
export const ScreenStackHeaderLeftView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/React.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "left",
    synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubview, style]
  }));
};
export const ScreenStackHeaderCenterView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/React.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "center",
    synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubviewCenter, style]
  }));
};
export const ScreenStackHeaderSearchBarView = props => /*#__PURE__*/React.createElement(ScreenStackHeaderSubview, _extends({}, props, {
  type: "searchBar",
  synchronousShadowStateUpdatesEnabled: featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled,
  style: styles.headerSubview
}));
const styles = StyleSheet.create({
  headerSubview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerSubviewCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1
  },
  headerConfig: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // We only want to center align the subviews on iOS.
    // See https://github.com/software-mansion/react-native-screens/pull/2456
    alignItems: Platform.OS === 'ios' ? 'center' : undefined
  }
});
//# sourceMappingURL=ScreenStackHeaderConfig.js.map