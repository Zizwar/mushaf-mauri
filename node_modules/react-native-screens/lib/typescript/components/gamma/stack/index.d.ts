import { StackHost } from './host';
import { StackScreen } from './screen';
import { StackHeaderConfig } from './header';
export type { StackHostProps } from './host';
export type { OnDismissEventPayload, EmptyEventPayload, // TODO: Remove this from public types (we need one shared type for this)
OnDismissEvent, StackScreenActivityMode, StackScreenEventHandler, StackScreenProps, } from './screen';
export type { StackHeaderConfigPropsBase, StackHeaderConfigProps, StackHeaderTypeAndroid, StackHeaderBackgroundSubviewCollapseModeAndroid, StackHeaderToolbarSubviewAndroid, StackHeaderBackgroundSubviewAndroid, StackHeaderConfigPropsAndroid, StackHeaderConfigPropsIOS, } from './header';
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
export declare const Stack: {
    Host: typeof StackHost;
    Screen: typeof StackScreen;
    HeaderConfig: typeof StackHeaderConfig;
};
//# sourceMappingURL=index.d.ts.map