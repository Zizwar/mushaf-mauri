'use strict';

/* eslint-disable */

export function isFabric() {
  return !!global.RN$Bridgeless;
}
export function getShadowNodeWrapperAndTagFromRef(ref) {
  if (!ref) {
    return {
      shadowNodeWrapper: null,
      tag: -1
    };
  }
  const internalRef = ref;
  return {
    shadowNodeWrapper: internalRef.__internalInstanceHandle.stateNode.node,
    tag: internalRef.__nativeTag
  };
}
//# sourceMappingURL=fabricUtils.js.map