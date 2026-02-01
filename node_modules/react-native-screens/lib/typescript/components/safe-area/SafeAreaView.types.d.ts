import { ViewProps } from 'react-native';
export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type InsetType = 'all' | 'system' | 'interface';
export interface SafeAreaViewProps extends ViewProps {
    edges?: Readonly<Partial<Record<Edge, boolean>>>;
    insetType?: InsetType;
}
//# sourceMappingURL=SafeAreaView.types.d.ts.map