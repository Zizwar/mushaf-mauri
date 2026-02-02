let isDetailedLoggingEnabled = false;
export function bottomTabsDebugLog(...args) {
  if (isDetailedLoggingEnabled) {
    console.log(...args);
  }
}
export function internalEnableDetailedBottomTabsLogging() {
  isDetailedLoggingEnabled = true;
}
//# sourceMappingURL=logging.js.map