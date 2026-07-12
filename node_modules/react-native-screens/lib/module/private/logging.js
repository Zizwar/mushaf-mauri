import { featureFlags } from '../flags';
export const RNSLog = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (message, ...args) => {
    if (featureFlags.stable.debugLogging) {
      console.log(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (message, ...args) => {
    if (featureFlags.stable.debugLogging) {
      console.warn(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message, ...args) => {
    if (featureFlags.stable.debugLogging) {
      console.error(message, ...args);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message, ...args) => {
    if (featureFlags.stable.debugLogging) {
      console.info(message, ...args);
    }
  }
};
//# sourceMappingURL=logging.js.map