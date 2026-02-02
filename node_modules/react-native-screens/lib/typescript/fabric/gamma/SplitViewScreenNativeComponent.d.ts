import type { CodegenTypes as CT, ViewProps } from 'react-native';
type GenericEmptyEvent = Readonly<{}>;
type SplitViewScreenColumnType = 'column' | 'inspector';
interface NativeProps extends ViewProps {
    columnType?: CT.WithDefault<SplitViewScreenColumnType, 'column'>;
    onWillAppear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onDidAppear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onWillDisappear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onDidDisappear?: CT.DirectEventHandler<GenericEmptyEvent>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=SplitViewScreenNativeComponent.d.ts.map