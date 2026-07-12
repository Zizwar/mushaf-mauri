"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveLaunchPropsAsync", {
    enumerable: true,
    get: function() {
        return resolveLaunchPropsAsync;
    }
});
function _configplugins() {
    const data = require("@expo/config-plugins");
    _configplugins = function() {
        return data;
    };
    return data;
}
const _AndroidAppIdResolver = require("../../start/platforms/android/AndroidAppIdResolver");
const _errors = require("../../utils/errors");
function resolveCustomLaunchActivity(packageName, mainActivity) {
    return mainActivity.startsWith('.') ? `${packageName}${mainActivity}` : mainActivity;
}
async function getMainActivityAsync(projectRoot) {
    const filePath = await _configplugins().AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const androidManifest = await _configplugins().AndroidConfig.Manifest.readAndroidManifestAsync(filePath);
    const runnableActivity = _configplugins().AndroidConfig.Manifest.getRunnableActivity(androidManifest);
    if (runnableActivity) {
        return runnableActivity.$['android:name'];
    }
    const mainActivity = _configplugins().AndroidConfig.Manifest.getMainActivity(androidManifest);
    if (!mainActivity) {
        throw new _errors.CommandError('ANDROID_MALFORMED', `${filePath} is missing a runnable activity element.`);
    }
    return mainActivity.$['android:name'];
}
async function resolveLaunchPropsAsync(projectRoot, options) {
    const mainActivity = await getMainActivityAsync(projectRoot);
    const packageName = await new _AndroidAppIdResolver.AndroidAppIdResolver(projectRoot).getAppIdFromNativeAsync();
    const customAppId = options.appId;
    const launchActivity = customAppId && customAppId !== packageName ? `${customAppId}/${resolveCustomLaunchActivity(packageName, mainActivity)}` : `${packageName}/${mainActivity}`;
    return {
        mainActivity,
        launchActivity,
        packageName,
        customAppId
    };
}

//# sourceMappingURL=resolveLaunchProps.js.map