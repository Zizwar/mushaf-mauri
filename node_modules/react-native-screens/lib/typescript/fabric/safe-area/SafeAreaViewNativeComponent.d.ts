import type { CodegenTypes as CT, ViewProps } from 'react-native';
type InsetType = 'all' | 'system' | 'interface';
export interface NativeProps extends ViewProps {
    edges?: Readonly<{
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
    }>;
    insetType?: CT.WithDefault<InsetType, 'all'>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=SafeAreaViewNativeComponent.d.ts.map