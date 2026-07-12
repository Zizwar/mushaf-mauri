/**
 * Exposes information useful for downstream navigation library implementers,
 * so they can keep reasonable backward compatibility, if desired.
 *
 * We don't mean for this object to only grow in number of fields, however at the same time
 * we won't be very hasty to reduce it. Expect gradual changes.
 */
export declare const compatibilityFlags: {
    /**
     * Because of a bug introduced in https://github.com/software-mansion/react-native-screens/pull/1646
     * react-native-screens v3.21 changed how header's backTitle handles whitespace strings in https://github.com/software-mansion/react-native-screens/pull/1726
     * To allow for backwards compatibility in @react-navigation/native-stack we need a way to check if this version or newer is used.
     * See https://github.com/react-navigation/react-navigation/pull/11423 for more context.
     */
    readonly isNewBackTitleImplementation: true;
    /**
     * With version 4.0.0 the header implementation has been changed. To allow for backward compat
     * with native-stack@v6 we want to expose a way to check whether the new implementation
     * is in use or not.
     *
     * See:
     * * https://github.com/software-mansion/react-native-screens/pull/2325
     * * https://github.com/react-navigation/react-navigation/pull/12125
     */
    readonly usesHeaderFlexboxImplementation: true;
    /**
     * In https://github.com/software-mansion/react-native-screens/pull/3402, we fix values
     * reported in `onHeaderHeightChange` event on Android. To allow backward compatibility in
     * `@react-navigation/native-stack`, we expose a way to check whether the new implementation
     * is in use or not.
     */
    readonly usesNewAndroidHeaderHeightImplementation: true;
    /**
     * Numerous "breaking changes" in the yet-experimental Tabs API have been
     * introduced with version 4.25.0 of the library.
     *
     * This flag marks the shape of the API that's meant for stabilisation, and
     * enables downstream to detect these changes.
     *
     * See:
     * * https://github.com/software-mansion/react-native-screens/pull/3888
     * * https://github.com/software-mansion/react-native-screens/pull/3776
     * * https://github.com/software-mansion/react-native-screens/pull/3781
     * * https://github.com/software-mansion/react-native-screens/pull/3756
     * * https://github.com/software-mansion/react-native-screens/pull/3808
     * * https://github.com/software-mansion/react-native-screens/pull/3785
     * * https://github.com/software-mansion/react-native-screens/pull/3789
     * * https://github.com/software-mansion/react-native-screens/pull/3794
     * * https://github.com/software-mansion/react-native-screens/pull/3863
     * * https://github.com/software-mansion/react-native-screens/pull/3875
     * * https://github.com/software-mansion/react-native-screens/pull/3895
     * * https://github.com/software-mansion/react-native-screens/pull/3918
     */
    readonly usesStableTabsApi: true;
};
/**
 * Exposes configurable global behaviour of the library.
 *
 * Most of these can be overridden on particular component level, these are global switches.
 */
export declare const featureFlags: {
    /**
     *  Flags to enable experimental features. These might be removed w/o notice or moved to stable.
     */
    experiment: {
        synchronousScreenUpdatesEnabled: boolean;
        synchronousHeaderConfigUpdatesEnabled: boolean;
        synchronousHeaderSubviewUpdatesEnabled: boolean;
        androidLegacyTopInsetBehavior: boolean;
        androidResetScreenShadowStateOnOrientationChangeEnabled: boolean;
        /**
         * Enables the fix for native / JS state desynchronization in Stack. On by default.
         * PR: https://github.com/software-mansion/react-native-screens/pull/3584
         */
        iosPreventReattachmentOfDismissedScreens: boolean;
        /**
         * Enables the fix for native / JS state desynchronization for Modals. On by default.
         * PR: https://github.com/software-mansion/react-native-screens/pull/3760
         */
        iosPreventReattachmentOfDismissedModals: boolean;
        /**
         * Disables the behavior that blocks interactions during Stack Screen transition.
         * The application should immediately react to user gestures, dismissing more screens at once, etc.
         * Use only with `iosPreventReattachmentOfDismissedScreens = true` to enable the fix
         * for native / JS state desynchronization. On by default.
         * PR: https://github.com/software-mansion/react-native-screens/pull/3631
         */
        ios26AllowInteractionsDuringTransition: boolean;
    };
    /**
     * Section for stable flags, which can be used to configure library behaviour.
     */
    stable: {
        debugLogging: boolean;
    };
};
export default featureFlags;
//# sourceMappingURL=flags.d.ts.map