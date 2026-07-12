import * as React from 'react';
import { type StyleProp, type ViewStyle, View } from 'react-native';
import { ScreenProps, ScreenStackHeaderConfigProps } from '../types';
type Props = Omit<ScreenProps, 'enabled' | 'isNativeStack' | 'hasLargeHeader'> & {
    screenId: string;
    headerConfig?: ScreenStackHeaderConfigProps | undefined;
    contentStyle?: StyleProp<ViewStyle> | undefined;
};
declare const _default: React.ForwardRefExoticComponent<Omit<Props, "ref"> & React.RefAttributes<View>>;
export default _default;
//# sourceMappingURL=ScreenStackItem.d.ts.map