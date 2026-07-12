import type { CodegenTypes as CT, ViewProps, ColorValue } from 'react-native';
type FinishTransitioningEvent = Readonly<{}>;
export interface NativeProps extends ViewProps {
    iosPreventReattachmentOfDismissedScreens?: CT.WithDefault<boolean, true>;
    iosPreventReattachmentOfDismissedModals?: CT.WithDefault<boolean, true>;
    nativeContainerBackgroundColor?: ColorValue | undefined;
    onFinishTransitioning?: CT.DirectEventHandler<FinishTransitioningEvent> | undefined;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=ScreenStackNativeComponent.d.ts.map