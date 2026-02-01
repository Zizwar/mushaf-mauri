import React from 'react';
import { findNodeHandle } from 'react-native';
// A hook that logs information when component is rendered, mounted and unmounted.
// It returns a ref that can be passed to a component instance in order to
// enrich the logging information with the component's node handle.
export function useRenderDebugInfo(componentName) {
  const componentRef = React.useRef(null);
  const componentNodeHandle = React.useRef(-1);
  const logMessageEvent = React.useEffectEvent(message => {
    logMessage(componentName, componentNodeHandle.current, message);
  });
  React.useEffect(() => {
    if (componentRef.current != null) {
      componentNodeHandle.current = findNodeHandle(componentRef.current) ?? -1;
      if (componentNodeHandle.current === -1) {
        logMessageEvent('failed to find node handle');
      }
    }
    logMessageEvent('mounted');
    return () => {
      logMessageEvent('unmounted');
    };
  }, []);
  logMessage(componentName, componentNodeHandle.current, 'rendered');
  return componentRef;
}
function logMessage(componentName, nodeHandle, message) {
  console.log(`${componentName} [${nodeHandle}] ${message}`);
}
//# sourceMappingURL=useRenderDebugInfo.js.map