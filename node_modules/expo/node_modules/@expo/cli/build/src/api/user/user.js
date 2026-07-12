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
    get ANONYMOUS_USERNAME () {
        return ANONYMOUS_USERNAME;
    },
    get browserLoginAsync () {
        return browserLoginAsync;
    },
    get getActorDisplayName () {
        return getActorDisplayName;
    },
    get getUserAsync () {
        return getUserAsync;
    },
    get loginAsync () {
        return loginAsync;
    },
    get logoutAsync () {
        return logoutAsync;
    }
});
function _fs() {
    const data = require("fs");
    _fs = function() {
        return data;
    };
    return data;
}
const _UserSettings = require("./UserSettings");
const _expoSsoLauncher = require("./expoSsoLauncher");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _codesigning = require("../../utils/codesigning");
const _env = require("../../utils/env");
const _endpoint = require("../endpoint");
const _UserQuery = require("../graphql/queries/UserQuery");
const _client = require("../rest/client");
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
const debug = require('debug')('expo:api:user');
let currentUser;
const ANONYMOUS_USERNAME = 'anonymous';
function getActorDisplayName(user) {
    switch(user == null ? void 0 : user.__typename){
        case 'User':
            return user.username;
        case 'SSOUser':
            return user.username;
        case 'Robot':
            return user.firstName ? `${user.firstName} (robot)` : 'robot';
        default:
            return ANONYMOUS_USERNAME;
    }
}
async function getUserAsync() {
    var _getSession;
    const hasCredentials = (0, _UserSettings.getAccessToken)() || ((_getSession = (0, _UserSettings.getSession)()) == null ? void 0 : _getSession.sessionSecret);
    if (!_env.env.EXPO_OFFLINE && !currentUser && hasCredentials) {
        const user = await _UserQuery.UserQuery.currentUserAsync();
        currentUser = user ?? undefined;
    }
    return currentUser;
}
async function loginAsync(credentials) {
    const res = await (0, _client.fetchAsync)('auth/loginAsync', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    const json = await res.json();
    const sessionSecret = json.data.sessionSecret;
    const userData = await _UserQuery.UserQuery.meUserActorAsync({
        'expo-session': sessionSecret
    });
    await (0, _UserSettings.setSessionAsync)({
        sessionSecret,
        userId: userData.id,
        username: userData.username,
        currentConnection: 'Username-Password-Authentication'
    });
}
async function browserLoginAsync({ sso = false }) {
    const sessionSecret = await (0, _expoSsoLauncher.getSessionUsingBrowserAuthFlowAsync)({
        expoWebsiteUrl: (0, _endpoint.getExpoWebsiteBaseUrl)(),
        sso
    });
    const userData = await _UserQuery.UserQuery.meUserActorAsync({
        'expo-session': sessionSecret
    });
    await (0, _UserSettings.setSessionAsync)({
        sessionSecret,
        userId: userData.id,
        username: userData.username,
        currentConnection: 'Browser-Flow-Authentication'
    });
}
async function logoutAsync() {
    var _getSession;
    const sessionSecret = (_getSession = (0, _UserSettings.getSession)()) == null ? void 0 : _getSession.sessionSecret;
    if (sessionSecret) {
        try {
            await (0, _client.fetchAsync)('auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            debug('Failed to invalidate session secret on server:', error);
        }
    }
    currentUser = undefined;
    await Promise.all([
        _fs().promises.rm((0, _codesigning.getDevelopmentCodeSigningDirectory)(), {
            recursive: true,
            force: true
        }),
        (0, _UserSettings.setSessionAsync)(undefined)
    ]);
    _log.log('Logged out');
}

//# sourceMappingURL=user.js.map