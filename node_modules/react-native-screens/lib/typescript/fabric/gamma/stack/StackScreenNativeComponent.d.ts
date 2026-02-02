import type { CodegenTypes as CT, ViewProps } from 'react-native';
type GenericEmptyEvent = Readonly<{}>;
type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
}>;
type ActivityMode = 'detached' | 'attached';
export interface NativeProps extends ViewProps {
    activityMode?: CT.WithDefault<ActivityMode, 'detached'>;
    screenKey: string;
    onWillAppear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onDidAppear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onWillDisappear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onDidDisappear?: CT.DirectEventHandler<GenericEmptyEvent>;
    onDismiss?: CT.DirectEventHandler<OnDismissEventPayload>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=StackScreenNativeComponent.d.ts.map