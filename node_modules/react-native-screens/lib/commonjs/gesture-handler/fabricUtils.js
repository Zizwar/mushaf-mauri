'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getShadowNodeWrapperAndTagFromRef = getShadowNodeWrapperAndTagFromRef;
exports.isFabric = isFabric;
/* eslint-disable */

function isFabric() {
  return !!global.RN$Bridgeless;
}
function getShadowNodeWrapperAndTagFromRef(ref) {
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