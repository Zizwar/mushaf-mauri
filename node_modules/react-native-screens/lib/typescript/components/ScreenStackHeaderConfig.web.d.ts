import { ImageProps, ViewProps } from 'react-native';
import React from 'react';
import { HeaderSubviewTypes, ScreenStackHeaderConfigProps } from '../types';
export declare const ScreenStackHeaderBackButtonImage: (props: ImageProps) => React.JSX.Element;
export declare const ScreenStackHeaderRightView: (props: ViewProps) => React.JSX.Element;
export declare const ScreenStackHeaderLeftView: (props: ViewProps) => React.JSX.Element;
export declare const ScreenStackHeaderCenterView: (props: ViewProps) => React.JSX.Element;
export declare const ScreenStackHeaderSearchBarView: (props: ViewProps) => React.JSX.Element;
export declare const ScreenStackHeaderConfig: (props: ScreenStackHeaderConfigProps) => React.JSX.Element;
export declare const ScreenStackHeaderSubview: React.ComponentType<ViewProps & {
    type?: HeaderSubviewTypes;
}>;
//# sourceMappingURL=ScreenStackHeaderConfig.web.d.ts.map