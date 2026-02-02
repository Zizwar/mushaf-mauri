'use client';

import { codegenNativeCommands, codegenNativeComponent } from 'react-native';

// eslint-disable-next-line @typescript-eslint/ban-types

export const Commands = codegenNativeCommands({
  supportedCommands: ['blur', 'focus', 'clearText', 'toggleCancelButton', 'setText', 'cancelSearch']
});
export default codegenNativeComponent('RNSSearchBar', {});
//# sourceMappingURL=SearchBarNativeComponent.js.map