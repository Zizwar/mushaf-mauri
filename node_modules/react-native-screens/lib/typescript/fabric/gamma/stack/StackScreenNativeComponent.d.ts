import type { CodegenTypes as CT, ViewProps } from 'react-native';
type GenericEmptyEvent = Readonly<{}>;
type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
}>;
type ActivityMode = 'detached' | 'attached';
export interface NativeProps extends ViewProps {
    activityMode?: CT.WithDefault<ActivityMode, 'detached'>;
    screenKey: string;
    onWillAppear?: CT.DirectEventHandler<GenericEmptyEvent> | undefined;
    onDidAppear?: CT.DirectEventHandler<GenericEmptyEvent> | undefined;
    onWillDisappear?: CT.DirectEventHandler<GenericEmptyEvent> | undefined;
    onDidDisappear?: CT.DirectEventHandler<GenericEmptyEvent> | undefined;
    onDismiss?: CT.DirectEventHandler<OnDismissEventPayload> | undefined;
    onNativeDismissPrevented?: CT.DirectEventHandler<GenericEmptyEvent> | undefined;
    preventNativeDismiss?: CT.WithDefault<boolean, false>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=StackScreenNativeComponent.d.ts.map