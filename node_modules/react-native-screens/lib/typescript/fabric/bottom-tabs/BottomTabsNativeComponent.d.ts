import type { CodegenTypes as CT, ColorValue, ViewProps } from 'react-native';
type NativeFocusChangeEvent = {
    tabKey: string;
    repeatedSelectionHandledBySpecialEffect: boolean;
};
type TabBarItemLabelVisibilityMode = 'auto' | 'selected' | 'labeled' | 'unlabeled';
type TabBarMinimizeBehavior = 'automatic' | 'never' | 'onScrollDown' | 'onScrollUp';
type TabBarControllerMode = 'automatic' | 'tabBar' | 'tabSidebar';
export interface NativeProps extends ViewProps {
    onNativeFocusChange?: CT.DirectEventHandler<NativeFocusChangeEvent>;
    tabBarHidden?: CT.WithDefault<boolean, false>;
    nativeContainerBackgroundColor?: ColorValue;
    tabBarBackgroundColor?: ColorValue;
    tabBarItemTitleFontFamily?: string;
    tabBarItemTitleFontSize?: CT.Float;
    tabBarItemTitleFontSizeActive?: CT.Float;
    tabBarItemTitleFontWeight?: string;
    tabBarItemTitleFontStyle?: string;
    tabBarItemTitleFontColor?: ColorValue;
    tabBarItemTitleFontColorActive?: ColorValue;
    tabBarItemIconColor?: ColorValue;
    tabBarItemIconColorActive?: ColorValue;
    tabBarItemActiveIndicatorColor?: ColorValue;
    tabBarItemActiveIndicatorEnabled?: CT.WithDefault<boolean, true>;
    tabBarItemRippleColor?: ColorValue;
    tabBarItemLabelVisibilityMode?: CT.WithDefault<TabBarItemLabelVisibilityMode, 'auto'>;
    tabBarTintColor?: ColorValue;
    tabBarMinimizeBehavior?: CT.WithDefault<TabBarMinimizeBehavior, 'automatic'>;
    tabBarControllerMode?: CT.WithDefault<TabBarControllerMode, 'automatic'>;
    controlNavigationStateInJS?: CT.WithDefault<boolean, false>;
}
declare const _default: import("react-native").HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=BottomTabsNativeComponent.d.ts.map