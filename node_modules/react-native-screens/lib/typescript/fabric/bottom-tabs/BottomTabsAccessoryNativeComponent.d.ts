import type { CodegenTypes as CT, ViewProps } from 'react-native';
type EnvironmentChangeEvent = {
    environment: 'regular' | 'inline';
};
export interface NativeProps extends ViewProps {
    onEnvironmentChange?: CT.DirectEventHandler<EnvironmentChangeEvent>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=BottomTabsAccessoryNativeComponent.d.ts.map