import { HeaderBarButtonItem } from 'react-native-screens/types';
export declare const prepareHeaderBarButtonItems: (barButtonItems: HeaderBarButtonItem[], side: "left" | "right") => (import("react-native-screens/types").HeaderBarButtonItemSpacing | {
    buttonId: string;
    imageSource: import("react-native").ImageResolvedAssetSource | undefined;
    templateSource: import("react-native").ImageResolvedAssetSource | undefined;
    sfSymbolName: string | undefined;
    titleStyle: {
        color: import("react-native").ProcessedColorValue | null | undefined;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
    } | undefined;
    tintColor: import("react-native").ProcessedColorValue | null | undefined;
    badge: {
        style: {
            color: import("react-native").ProcessedColorValue | null | undefined;
            backgroundColor: import("react-native").ProcessedColorValue | null | undefined;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
        };
        value: string;
    } | undefined;
    type: "button";
    onPress: () => void;
    selected?: boolean;
    index?: number;
    title?: string;
    icon?: import("react-native-screens/types").PlatformIconIOS;
    variant?: "plain" | "done" | "prominent";
    disabled?: boolean;
    width?: number;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    identifier?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
} | {
    buttonId: string;
    imageSource: import("react-native").ImageResolvedAssetSource | undefined;
    templateSource: import("react-native").ImageResolvedAssetSource | undefined;
    sfSymbolName: string | undefined;
    titleStyle: {
        color: import("react-native").ProcessedColorValue | null | undefined;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
    } | undefined;
    tintColor: import("react-native").ProcessedColorValue | null | undefined;
    badge: {
        style: {
            color: import("react-native").ProcessedColorValue | null | undefined;
            backgroundColor: import("react-native").ProcessedColorValue | null | undefined;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
        };
        value: string;
    } | undefined;
    type: "menu";
    menu: {
        title?: string;
        items: (import("react-native-screens/types").HeaderBarButtonItemMenuAction | import("react-native-screens/types").HeaderBarButtonItemSubmenu)[];
        singleSelection?: boolean;
        displayAsPalette?: boolean;
    };
    changesSelectionAsPrimaryAction?: boolean;
    index?: number;
    title?: string;
    icon?: import("react-native-screens/types").PlatformIconIOS;
    variant?: "plain" | "done" | "prominent";
    disabled?: boolean;
    width?: number;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    identifier?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
} | {
    menu: {
        title?: string;
        items: (import("react-native-screens/types").HeaderBarButtonItemMenuAction | import("react-native-screens/types").HeaderBarButtonItemSubmenu)[];
        singleSelection?: boolean;
        displayAsPalette?: boolean;
    };
    imageSource: import("react-native").ImageResolvedAssetSource | undefined;
    templateSource: import("react-native").ImageResolvedAssetSource | undefined;
    sfSymbolName: string | undefined;
    titleStyle: {
        color: import("react-native").ProcessedColorValue | null | undefined;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
    } | undefined;
    tintColor: import("react-native").ProcessedColorValue | null | undefined;
    badge: {
        style: {
            color: import("react-native").ProcessedColorValue | null | undefined;
            backgroundColor: import("react-native").ProcessedColorValue | null | undefined;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
        };
        value: string;
    } | undefined;
    type: "button";
    onPress: () => void;
    selected?: boolean;
    index?: number;
    title?: string;
    icon?: import("react-native-screens/types").PlatformIconIOS;
    variant?: "plain" | "done" | "prominent";
    disabled?: boolean;
    width?: number;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    identifier?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
} | {
    menu: {
        title?: string;
        items: (import("react-native-screens/types").HeaderBarButtonItemMenuAction | import("react-native-screens/types").HeaderBarButtonItemSubmenu)[];
        singleSelection?: boolean;
        displayAsPalette?: boolean;
    };
    imageSource: import("react-native").ImageResolvedAssetSource | undefined;
    templateSource: import("react-native").ImageResolvedAssetSource | undefined;
    sfSymbolName: string | undefined;
    titleStyle: {
        color: import("react-native").ProcessedColorValue | null | undefined;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
    } | undefined;
    tintColor: import("react-native").ProcessedColorValue | null | undefined;
    badge: {
        style: {
            color: import("react-native").ProcessedColorValue | null | undefined;
            backgroundColor: import("react-native").ProcessedColorValue | null | undefined;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
        };
        value: string;
    } | undefined;
    type: "menu";
    changesSelectionAsPrimaryAction?: boolean;
    index?: number;
    title?: string;
    icon?: import("react-native-screens/types").PlatformIconIOS;
    variant?: "plain" | "done" | "prominent";
    disabled?: boolean;
    width?: number;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    identifier?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
} | null)[];
//# sourceMappingURL=prepareHeaderBarButtonItems.d.ts.map