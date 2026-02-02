"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bottomTabsDebugLog = bottomTabsDebugLog;
exports.internalEnableDetailedBottomTabsLogging = internalEnableDetailedBottomTabsLogging;
let isDetailedLoggingEnabled = false;
function bottomTabsDebugLog(...args) {
  if (isDetailedLoggingEnabled) {
    console.log(...args);
  }
}
function internalEnableDetailedBottomTabsLogging() {
  isDetailedLoggingEnabled = true;
}
//# sourceMappingURL=logging.js.map