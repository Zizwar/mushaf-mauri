"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RNSLog = void 0;
var _flags = require("../flags");
const RNSLog = exports.RNSLog = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (message, ...args) => {
    if (_flags.featureFlags.stable.debugLogging) {
      console.log(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (message, ...args) => {
    if (_flags.featureFlags.stable.debugLogging) {
      console.warn(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message, ...args) => {
    if (_flags.featureFlags.stable.debugLogging) {
      console.error(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message, ...args) => {
    if (_flags.featureFlags.stable.debugLogging) {
      console.info(message, ...args);
    }
  }
};
//# sourceMappingURL=logging.js.map