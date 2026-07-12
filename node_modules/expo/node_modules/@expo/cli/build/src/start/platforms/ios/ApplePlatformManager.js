"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApplePlatformManager", {
    enumerable: true,
    get: function() {
        return ApplePlatformManager;
    }
});
const _AppleAppIdResolver = require("./AppleAppIdResolver");
const _AppleDeviceManager = require("./AppleDeviceManager");
const _PlatformManager = require("../PlatformManager");
class ApplePlatformManager extends _PlatformManager.PlatformManager {
    constructor(projectRoot, port, options){
        super(projectRoot, {
            platform: 'ios',
            ...options,
            resolveDeviceAsync: _AppleDeviceManager.AppleDeviceManager.resolveAsync
        }), this.projectRoot = projectRoot, this.port = port;
    }
    async openAsync(options, resolveSettings) {
        await _AppleDeviceManager.AppleDeviceManager.assertSystemRequirementsAsync();
        // Expo Go only supports iOS (iPhone/iPad), not watchOS or tvOS.
        // Ensure device selection filters to iOS when launching Expo Go.
        if (options.runtime === 'expo') {
            resolveSettings = {
                ...resolveSettings,
                device: {
                    ...resolveSettings == null ? void 0 : resolveSettings.device,
                    osType: 'iOS'
                }
            };
        }
        return super.openAsync(options, resolveSettings);
    }
    _getAppIdResolver() {
        return new _AppleAppIdResolver.AppleAppIdResolver(this.projectRoot);
    }
    _resolveAlternativeLaunchUrl(applicationId, props) {
        return applicationId;
    }
}

//# sourceMappingURL=ApplePlatformManager.js.map