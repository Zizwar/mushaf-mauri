import { View } from 'react-native';
export declare function isFabric(): boolean;
export type HostInstance = {
    __internalInstanceHandle: Record<string, any>;
    __nativeTag: number;
    _viewConfig: Record<string, unknown>;
};
export declare function getShadowNodeWrapperAndTagFromRef(ref: View | null): {
    shadowNodeWrapper: any;
    tag: number;
};
//# sourceMappingURL=fabricUtils.d.ts.map