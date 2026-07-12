"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SimulatorAppPrerequisite", {
    enumerable: true,
    get: function() {
        return SimulatorAppPrerequisite;
    }
});
function _osascript() {
    const data = require("@expo/osascript");
    _osascript = function() {
        return data;
    };
    return data;
}
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
const _log = require("../../../log");
const _Prerequisite = require("../Prerequisite");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:doctor:apple:simulatorApp');
// NOTE(cedric): Xcode 27 Beta moved the `<xcode>/Contents/Developer/Applications` to `<xcode>/Contents/Applications`
const XCODE_DEVICE_HUB_PATH = '../Applications/DeviceHub.app/Contents/Info.plist';
const XCODE_SIMULATOR_PATH = './Applications/Simulator.app/Contents/Info.plist';
class SimulatorAppPrerequisite extends _Prerequisite.Prerequisite {
    static #_ = this.instance = new SimulatorAppPrerequisite();
    async assertImplementation() {
        // Xcode 27 replaces Simulator with DeviceHub
        // See: https://developer.apple.com/documentation/xcode/device-hub
        // TODO(cedric): once Xcode 27 stable is released, resolve DeviceHub first
        let appId = await (0, _osascript().safeIdOfAppAsync)('Simulator').then((appId)=>{
            return appId || (0, _osascript().safeIdOfAppAsync)('DeviceHub');
        });
        if (!appId) {
            const xcodePath = await getXcodeSelectPath();
            debug('Xcode select path: %s', xcodePath);
            if (xcodePath) {
                appId = await getXcodeInfoPlistBundleId(_nodepath().default.join(xcodePath, XCODE_SIMULATOR_PATH)).then((appId)=>{
                    return appId || getXcodeInfoPlistBundleId(_nodepath().default.join(xcodePath, XCODE_DEVICE_HUB_PATH));
                });
            }
        }
        if (!appId) {
            throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', "Can't determine id of Device Hub or Simulator app; the Device Hub or Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`");
        }
        if (appId !== 'com.apple.dt.Devices' && appId !== 'com.apple.iphonesimulator' && appId !== 'com.apple.CoreSimulator.SimulatorTrampoline') {
            throw new _Prerequisite.PrerequisiteCommandError('SIMULATOR_APP', `Device Hub or Simulator is installed but is identified as '${appId}'; don't know what that is.`);
        }
        debug('Xcode simulator app id: %s', appId);
        try {
            // make sure we can run simctl
            await (0, _spawnasync().default)('xcrun', [
                'simctl',
                'help'
            ]);
        } catch (error) {
            _log.Log.warn(`Unable to run simctl:\n${error.toString()}`);
            throw new _Prerequisite.PrerequisiteCommandError('SIMCTL', 'xcrun is not configured correctly. Ensure `sudo xcode-select --reset` works before running this command again.');
        }
    }
}
async function getXcodeSelectPath() {
    try {
        const result = await (0, _spawnasync().default)('xcode-select', [
            '--print-path'
        ]);
        return result.stdout.trim() || null;
    } catch  {
        return null;
    }
}
/**
 * Read the Info.plist of an app within Xcode and return the bundle ID.
 * This uses `defaults read <path>/Info.plist CFBundleIdentifier`.
 */ async function getXcodeInfoPlistBundleId(infoPlistPath) {
    try {
        const result = await (0, _spawnasync().default)('defaults', [
            'read',
            infoPlistPath,
            'CFBundleIdentifier'
        ]);
        return result.stdout.trim() || null;
    } catch  {
        return null;
    }
}

//# sourceMappingURL=SimulatorAppPrerequisite.js.map