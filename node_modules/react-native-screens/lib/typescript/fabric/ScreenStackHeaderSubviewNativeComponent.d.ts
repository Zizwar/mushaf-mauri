import type { CodegenTypes as CT, ViewProps } from 'react-native';
export type HeaderSubviewTypes = 'back' | 'right' | 'left' | 'title' | 'center' | 'searchBar';
export interface NativeProps extends ViewProps {
    type?: CT.WithDefault<HeaderSubviewTypes, 'left'>;
    hidesSharedBackground?: boolean;
    synchronousShadowStateUpdatesEnabled?: CT.WithDefault<boolean, false>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=ScreenStackHeaderSubviewNativeComponent.d.ts.map