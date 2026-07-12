"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get openJsInspector () {
        return openJsInspector;
    },
    get promptInspectorAppAsync () {
        return promptInspectorAppAsync;
    },
    get queryAllInspectorAppsAsync () {
        return queryAllInspectorAppsAsync;
    },
    get queryInspectorAppAsync () {
        return queryInspectorAppAsync;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
const _prompts = require("../../../../utils/prompts");
const _pageIsSupported = require("../../metro/debugging/pageIsSupported");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:start:server:middleware:inspector:jsInspector');
async function openJsInspector(metroBaseUrl, app) {
    var _app_reactNative;
    if (!((_app_reactNative = app.reactNative) == null ? void 0 : _app_reactNative.logicalDeviceId)) {
        debug('Failed to open React Native DevTools, target is missing device ID');
        return false;
    }
    const url = new URL('/open-debugger', metroBaseUrl);
    url.searchParams.set('target', app.id);
    // Request to open the React Native DevTools, but limit it to 1s
    // This is a workaround as this endpoint might not respond on some devices
    const response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(1000)
    }).catch((error)=>{
        // Only swallow timeout errors
        if (error.name === 'TimeoutError') {
            return null;
        }
        throw error;
    });
    if (!response) {
        debug(`No response received from the React Native DevTools.`);
    } else if (response.ok === false) {
        debug('Failed to open React Native DevTools, received response:', response.status);
    }
    return (response == null ? void 0 : response.ok) ?? true;
}
async function queryInspectorAppAsync(metroServerOrigin, appId) {
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    return apps.find((app)=>app.appId === appId) ?? null;
}
async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await fetch(`${metroServerOrigin}/json/list`);
    // The newest runtime will be at the end of the list,
    // reversing the result would save time from try-error.
    const apps = (await resp.json()).reverse();
    return apps.filter((app)=>(0, _pageIsSupported.pageIsSupported)(app));
}
async function promptInspectorAppAsync(apps) {
    var _choices_find;
    if (apps.length === 1) {
        return apps[0];
    }
    // Check if multiple devices are connected with the same device names
    // In this case, append the actual app id (device ID + page number) to the prompt
    const hasDuplicateNames = apps.some((app, index)=>index !== apps.findIndex((other)=>app.deviceName === other.deviceName));
    const choices = apps.map((app)=>{
        const name = app.deviceName ?? 'Unknown device';
        return {
            title: hasDuplicateNames ? (0, _chalk().default)`${name}{dim  - ${app.id}}` : name,
            value: app.id,
            app
        };
    });
    const value = await (0, _prompts.selectAsync)((0, _chalk().default)`Debug target {dim (Hermes only)}`, choices);
    return (_choices_find = choices.find((item)=>item.value === value)) == null ? void 0 : _choices_find.app;
}

//# sourceMappingURL=JsInspector.js.map