import { BackHandler, Platform } from 'react-native';
export const isSearchBarAvailableForCurrentPlatform = ['ios', 'android'].includes(Platform.OS);
export const isHeaderBarButtonsAvailableForCurrentPlatform = Platform.OS === 'ios';
export function executeNativeBackPress() {
  // This function invokes the native back press event
  BackHandler.exitApp();
  return true;
}
export function parseBooleanToOptionalBooleanNativeProp(prop) {
  switch (prop) {
    case undefined:
      return 'undefined';
    case true:
      return 'true';
    case false:
      return 'false';
  }
}
//# sourceMappingURL=utils.js.map