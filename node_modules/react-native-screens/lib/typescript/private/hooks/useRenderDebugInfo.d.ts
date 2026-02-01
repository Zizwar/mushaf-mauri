import React from 'react';
import { ReactNativeElement } from 'react-native';
export type NativeComponentGenericRef = React.Component & ReactNativeElement;
export declare function useRenderDebugInfo<RefType extends React.Component>(componentName: string): React.RefObject<RefType | null>;
//# sourceMappingURL=useRenderDebugInfo.d.ts.map