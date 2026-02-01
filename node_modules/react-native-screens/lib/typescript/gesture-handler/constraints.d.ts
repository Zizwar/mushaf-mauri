import { AnimatedScreenTransition, GoBackGesture } from 'react-native-reanimated';
import { GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
export declare function getAnimationForTransition(goBackGesture: GoBackGesture | undefined, customTransitionAnimation: AnimatedScreenTransition | undefined): AnimatedScreenTransition;
export declare function checkBoundaries(goBackGesture: string | undefined, event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void;
export declare function checkIfTransitionCancelled(goBackGesture: string | undefined, distanceX: number, requiredXDistance: number, distanceY: number, requiredYDistance: number): boolean;
//# sourceMappingURL=constraints.d.ts.map