"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRenderDebugInfo = useRenderDebugInfo;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// A hook that logs information when component is rendered, mounted and unmounted.
// It returns a ref that can be passed to a component instance in order to
// enrich the logging information with the component's node handle.
function useRenderDebugInfo(componentName) {
  const componentRef = _react.default.useRef(null);
  const componentNodeHandle = _react.default.useRef(-1);
  const logMessageEvent = _react.default.useEffectEvent(message => {
    logMessage(componentName, componentNodeHandle.current, message);
  });
  _react.default.useEffect(() => {
    if (componentRef.current != null) {
      componentNodeHandle.current = (0, _reactNative.findNodeHandle)(componentRef.current) ?? -1;
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