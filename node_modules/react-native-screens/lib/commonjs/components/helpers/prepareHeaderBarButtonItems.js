"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareHeaderBarButtonItems = void 0;
var _reactNative = require("react-native");
const prepareMenu = (menu, index, side) => {
  return {
    ...menu,
    items: menu.items.map((menuItem, menuIndex) => {
      const sfSymbolName = menuItem.icon?.type === 'sfSymbol' ? menuItem.icon.name : undefined;
      if (menuItem.type === 'submenu') {
        return {
          ...menuItem,
          sfSymbolName,
          ...prepareMenu(menuItem, menuIndex, side)
        };
      }
      return {
        ...menuItem,
        sfSymbolName,
        menuId: `${menuIndex}-${index}-${side}`
      };
    })
  };
};
const prepareHeaderBarButtonItems = (barButtonItems, side) => {
  return barButtonItems?.map((item, index) => {
    if (item.type === 'spacing') {
      return item;
    }
    let imageSource, templateSource;
    if (item.icon?.type === 'imageSource') {
      imageSource = _reactNative.Image.resolveAssetSource(item.icon.imageSource);
    } else if (item.icon?.type === 'templateSource') {
      templateSource = _reactNative.Image.resolveAssetSource(item.icon.templateSource);
    }
    const titleStyle = item.titleStyle ? {
      ...item.titleStyle,
      color: (0, _reactNative.processColor)(item.titleStyle.color)
    } : undefined;
    const tintColor = item.tintColor ? (0, _reactNative.processColor)(item.tintColor) : undefined;
    const badge = item.badge ? {
      ...item.badge,
      style: {
        ...item.badge.style,
        color: (0, _reactNative.processColor)(item.badge.style?.color),
        backgroundColor: (0, _reactNative.processColor)(item.badge.style?.backgroundColor)
      }
    } : undefined;
    const processedItem = {
      ...item,
      imageSource,
      templateSource,
      sfSymbolName: item.icon?.type === 'sfSymbol' ? item.icon.name : undefined,
      titleStyle,
      tintColor,
      badge
    };
    if (item.type === 'button') {
      return {
        ...processedItem,
        buttonId: `${index}-${side}`
      };
    }
    if (item.type === 'menu') {
      return {
        ...processedItem,
        menu: prepareMenu(item.menu, index, side)
      };
    }
    return null;
  });
};
exports.prepareHeaderBarButtonItems = prepareHeaderBarButtonItems;
//# sourceMappingURL=prepareHeaderBarButtonItems.js.map