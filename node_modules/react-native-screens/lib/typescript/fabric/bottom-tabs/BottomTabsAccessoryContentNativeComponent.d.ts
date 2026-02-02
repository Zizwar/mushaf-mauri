import type { CodegenTypes as CT, ViewProps } from 'react-native';
type BottomAccessoryEnvironment = 'regular' | 'inline';
export interface NativeProps extends ViewProps {
    environment?: CT.WithDefault<BottomAccessoryEnvironment, 'regular'>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=BottomTabsAccessoryContentNativeComponent.d.ts.map