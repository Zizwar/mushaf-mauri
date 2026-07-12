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
    get getAccessToken () {
        return getAccessToken;
    },
    get getAnonymousId () {
        return getAnonymousId;
    },
    get getAnonymousIdAsync () {
        return getAnonymousIdAsync;
    },
    get getExpoHomeDirectory () {
        return getExpoHomeDirectory;
    },
    get getSession () {
        return getSession;
    },
    get getSettings () {
        return getSettings;
    },
    get getSettingsDirectory () {
        return getSettingsDirectory;
    },
    get getSettingsFilePath () {
        return getSettingsFilePath;
    },
    get hasCredentials () {
        return hasCredentials;
    },
    get setSessionAsync () {
        return setSessionAsync;
    }
});
function _env() {
    const data = require("@expo/env");
    _env = function() {
        return data;
    };
    return data;
}
function _jsonfile() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/json-file"));
    _jsonfile = function() {
        return data;
    };
    return data;
}
function _crypto() {
    const data = /*#__PURE__*/ _interop_require_default(require("crypto"));
    _crypto = function() {
        return data;
    };
    return data;
}
function _getenv() {
    const data = require("getenv");
    _getenv = function() {
        return data;
    };
    return data;
}
function _os() {
    const data = require("os");
    _os = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function getExpoHomeDirectory() {
    const home = (0, _os().homedir)();
    // Read from the pre-dotenv env — this redirects the directory used for the
    // auth-token cache and other settings. The `__UNSAFE_` prefix marks it as a
    // shell-only escape hatch; a project `.env` setting it would hijack credentials.
    const unsafeHome = (0, _env().getOriginalEnvValue)('__UNSAFE_EXPO_HOME_DIRECTORY');
    if (unsafeHome) {
        return unsafeHome;
    } else if ((0, _getenv().boolish)('EXPO_STAGING', false)) {
        return _path().join(home, '.expo-staging');
    } else if ((0, _getenv().boolish)('EXPO_LOCAL', false)) {
        return _path().join(home, '.expo-local');
    }
    return _path().join(home, '.expo');
}
function getSettingsDirectory() {
    return getExpoHomeDirectory();
}
function getSettingsFilePath() {
    return _path().join(getExpoHomeDirectory(), 'state.json');
}
// state.json holds the auth session secret, so restrict it to the owner only.
const SETTINGS_FILE_MODE = 384;
function getSettings() {
    return new (_jsonfile()).default(getSettingsFilePath(), {
        ensureDir: true,
        mode: SETTINGS_FILE_MODE,
        jsonParseErrorDefault: {},
        // This will ensure that an error isn't thrown if the file doesn't exist.
        cantReadFileDefault: {}
    });
}
function getAccessToken() {
    return process.env.EXPO_TOKEN ?? null;
}
function getSession() {
    return getSettings().get('auth', null);
}
async function setSessionAsync(sessionData) {
    await getSettings().setAsync('auth', sessionData, {
        default: {}
    });
}
function hasCredentials() {
    return !!getAccessToken() || !!getSession();
}
async function getAnonymousIdAsync() {
    const settings = getSettings();
    let id = await settings.getAsync('uuid', null);
    if (!id) {
        id = _crypto().default.randomUUID();
        await settings.setAsync('uuid', id);
    }
    return id;
}
function getAnonymousId() {
    const settings = getSettings();
    let id = settings.get('uuid', null);
    if (!id) {
        id = _crypto().default.randomUUID();
        settings.set('uuid', id);
    }
    return id;
}

//# sourceMappingURL=UserSettings.js.map