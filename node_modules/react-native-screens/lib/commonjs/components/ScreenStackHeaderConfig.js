"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScreenStackHeaderSubview = exports.ScreenStackHeaderSearchBarView = exports.ScreenStackHeaderRightView = exports.ScreenStackHeaderLeftView = exports.ScreenStackHeaderConfig = exports.ScreenStackHeaderCenterView = exports.ScreenStackHeaderBackButtonImage = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _flags = _interopRequireDefault(require("../flags"));
var _ScreenStackHeaderConfigNativeComponent = _interopRequireDefault(require("../fabric/ScreenStackHeaderConfigNativeComponent"));
var _ScreenStackHeaderSubviewNativeComponent = _interopRequireDefault(require("../fabric/ScreenStackHeaderSubviewNativeComponent"));
var _prepareHeaderBarButtonItems = require("./helpers/prepareHeaderBarButtonItems");
var _utils = require("../utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } // Native components
const ScreenStackHeaderSubview = exports.ScreenStackHeaderSubview = _ScreenStackHeaderSubviewNativeComponent.default;
const ScreenStackHeaderConfig = exports.ScreenStackHeaderConfig = /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  const {
    headerLeftBarButtonItems,
    headerRightBarButtonItems
  } = props;
  const preparedHeaderLeftBarButtonItems = headerLeftBarButtonItems && _utils.isHeaderBarButtonsAvailableForCurrentPlatform ? (0, _prepareHeaderBarButtonItems.prepareHeaderBarButtonItems)(headerLeftBarButtonItems, 'left') : undefined;
  const preparedHeaderRightBarButtonItems = headerRightBarButtonItems && _utils.isHeaderBarButtonsAvailableForCurrentPlatform ? (0, _prepareHeaderBarButtonItems.prepareHeaderBarButtonItems)(headerRightBarButtonItems, 'right') : undefined;
  const hasHeaderBarButtonItems = _utils.isHeaderBarButtonsAvailableForCurrentPlatform && (preparedHeaderLeftBarButtonItems?.length || preparedHeaderRightBarButtonItems?.length);

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
  return /*#__PURE__*/_react.default.createElement(_ScreenStackHeaderConfigNativeComponent.default, _extends({}, props, {
    userInterfaceStyle: props.experimental_userInterfaceStyle,
    headerLeftBarButtonItems: preparedHeaderLeftBarButtonItems,
    headerRightBarButtonItems: preparedHeaderRightBarButtonItems,
    onPressHeaderBarButtonItem: onPressHeaderBarButtonItem,
    onPressHeaderBarButtonMenuItem: onPressHeaderBarButtonMenuItem,
    ref: ref,
    style: styles.headerConfig,
    pointerEvents: "box-none",
    synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderConfigUpdatesEnabled
  }));
});
ScreenStackHeaderConfig.displayName = 'ScreenStackHeaderConfig';
const ScreenStackHeaderBackButtonImage = props => /*#__PURE__*/_react.default.createElement(ScreenStackHeaderSubview, {
  type: "back",
  style: styles.headerSubview,
  synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderSubviewUpdatesEnabled
}, /*#__PURE__*/_react.default.createElement(_reactNative.Image, _extends({
  resizeMode: "center",
  fadeDuration: 0
}, props)));
exports.ScreenStackHeaderBackButtonImage = ScreenStackHeaderBackButtonImage;
const ScreenStackHeaderRightView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/_react.default.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "right",
    synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubview, style]
  }));
};
exports.ScreenStackHeaderRightView = ScreenStackHeaderRightView;
const ScreenStackHeaderLeftView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/_react.default.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "left",
    synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubview, style]
  }));
};
exports.ScreenStackHeaderLeftView = ScreenStackHeaderLeftView;
const ScreenStackHeaderCenterView = props => {
  const {
    style,
    ...rest
  } = props;
  return /*#__PURE__*/_react.default.createElement(ScreenStackHeaderSubview, _extends({}, rest, {
    type: "center",
    synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderSubviewUpdatesEnabled,
    style: [styles.headerSubviewCenter, style]
  }));
};
exports.ScreenStackHeaderCenterView = ScreenStackHeaderCenterView;
const ScreenStackHeaderSearchBarView = props => /*#__PURE__*/_react.default.createElement(ScreenStackHeaderSubview, _extends({}, props, {
  type: "searchBar",
  synchronousShadowStateUpdatesEnabled: _flags.default.experiment.synchronousHeaderSubviewUpdatesEnabled,
  style: styles.headerSubview
}));
exports.ScreenStackHeaderSearchBarView = ScreenStackHeaderSearchBarView;
const styles = _reactNative.StyleSheet.create({
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
    alignItems: _reactNative.Platform.OS === 'ios' ? 'center' : undefined
  }
});
//# sourceMappingURL=ScreenStackHeaderConfig.js.map