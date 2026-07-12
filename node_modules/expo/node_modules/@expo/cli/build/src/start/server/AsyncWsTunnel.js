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
    get AsyncWsTunnel () {
        return AsyncWsTunnel;
    },
    get getExpoAccountTunnelUrlAsync () {
        return getExpoAccountTunnelUrlAsync;
    }
});
function _config() {
    const data = require("@expo/config");
    _config = function() {
        return data;
    };
    return data;
}
function _wstunnel() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("@expo/ws-tunnel"));
    _wstunnel = function() {
        return data;
    };
    return data;
}
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
function _nodefs() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("node:fs"));
    _nodefs = function() {
        return data;
    };
    return data;
}
function _nodeos() {
    const data = require("node:os");
    _nodeos = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
const _TunnelMutation = require("../../api/graphql/mutations/TunnelMutation");
const _AppQuery = require("../../api/graphql/queries/AppQuery");
const _UserSettings = require("../../api/user/UserSettings");
const _user = require("../../api/user/user");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _env = require("../../utils/env");
const _errors = require("../../utils/errors");
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
const debug = require('debug')('expo:start:server:ws-tunnel');
class AsyncWsTunnel {
    constructor(projectRoot, port, options = {}){
        this.projectRoot = projectRoot;
        this.port = port;
        this.options = options;
        this.serverUrl = null;
    }
    getActiveUrl() {
        var _this_serverUrl;
        return ((_this_serverUrl = this.serverUrl) == null ? void 0 : _this_serverUrl.href) ?? null;
    }
    async startAsync() {
        this.serverUrl = await _wstunnel().startAsync({
            ...await this.getTunnelOptionsAsync(),
            onStatusChange (status) {
                if (status === 'disconnected') {
                    _log.error(_chalk().default.red('Tunnel connection has been closed. This is often related to intermittent connection problems with the ws proxy servers. Restart the dev server to try connecting again.') + _chalk().default.gray('\nCheck the Expo status page for outages: https://status.expo.dev/'));
                }
            }
        });
        debug('Tunnel URL:', this.serverUrl.href);
    }
    async getTunnelOptionsAsync() {
        if (this.options.useExpoAccount) {
            return this.getExpoAccountTunnelOptionsAsync();
        } else {
            return getLegacyTunnelOptions(this.port);
        }
    }
    async getExpoAccountTunnelOptionsAsync() {
        const apiUrl = await getExpoAccountTunnelUrlAsync(this.projectRoot);
        if (!apiUrl) {
            const cause = (0, _UserSettings.hasCredentials)() ? `Your Expo account may not have access to it, or the tunnel service is unavailable.` : `You're not logged in to your Expo account — run 'npx expo login'.`;
            throw new _errors.CommandError('WS_TUNNEL_SIGNED_URL', `Couldn't create a signed tunnel URL for this project. ${cause} ` + `Unset EXPO_UNSTABLE_TUNNEL_V2 to use an ngrok tunnel instead.`);
        }
        return {
            apiUrl,
            targetUrl: `http://localhost:${this.port}`
        };
    }
    async stopAsync() {
        debug('Stopping Tunnel');
        await _wstunnel().stopAsync();
        this.serverUrl = null;
    }
}
function getLegacyTunnelOptions(port) {
    if (port !== 8081) {
        throw new _errors.CommandError('WS_TUNNEL_PORT', `WS-tunnel only supports tunneling over port 8081, attempted to use port ${port}`);
    }
    function randomSessionId() {
        const randomPart = ()=>(Math.random().toString(36) + '00000').slice(2, 7);
        return randomPart() + randomPart() + randomPart();
    }
    function getWebcontainerSession() {
        let session = randomSessionId();
        if ((0, _env.envIsWebcontainer)()) {
            const leaseId = Buffer.from((0, _nodeos().hostname)()).toString('base64url');
            const leaseFile = _nodepath().join((0, _nodeos().tmpdir)(), `_ws_tunnel_lease_${leaseId}`);
            try {
                session = _nodefs().readFileSync(leaseFile, 'utf8').trim() || session;
            } catch  {}
            try {
                _nodefs().writeFileSync(leaseFile, session, 'utf8');
            } catch  {}
        }
        return session;
    }
    const userDefinedSubdomain = _env.env.EXPO_TUNNEL_SUBDOMAIN;
    if (userDefinedSubdomain && typeof userDefinedSubdomain === 'string') {
        debug('Session:', userDefinedSubdomain);
        return {
            session: userDefinedSubdomain
        };
    }
    return {
        session: getWebcontainerSession()
    };
}
async function getExpoAccountTunnelUrlAsync(projectRoot) {
    async function resolveExpoAccountIdAsync(projectRoot) {
        var _exp_extra_eas, _exp_extra, _actor_accounts_;
        const { exp } = (0, _config().getConfig)(projectRoot, {
            skipSDKVersionRequirement: true
        });
        const easProjectId = (_exp_extra = exp.extra) == null ? void 0 : (_exp_extra_eas = _exp_extra.eas) == null ? void 0 : _exp_extra_eas.projectId;
        if (easProjectId) {
            try {
                var _app_ownerAccount;
                const app = await _AppQuery.AppQuery.byIdAsync(easProjectId);
                const appOwnerAccountId = app == null ? void 0 : (_app_ownerAccount = app.ownerAccount) == null ? void 0 : _app_ownerAccount.id;
                if (appOwnerAccountId) {
                    return appOwnerAccountId;
                }
            } catch (error) {
                debug('Failed to resolve owning account from EAS project ID:', error);
            }
        }
        const actor = await (0, _user.getUserAsync)();
        if (!actor) {
            return null;
        } else if (actor.__typename === 'User' || actor.__typename === 'SSOUser') {
            var _actor_primaryAccount;
            const actorPrimaryAccountId = (_actor_primaryAccount = actor.primaryAccount) == null ? void 0 : _actor_primaryAccount.id;
            if (actorPrimaryAccountId) {
                return actorPrimaryAccountId;
            }
        }
        // Robots have no primary account; fall back to their first available account.
        return ((_actor_accounts_ = actor.accounts[0]) == null ? void 0 : _actor_accounts_.id) ?? null;
    }
    try {
        const accountId = await resolveExpoAccountIdAsync(projectRoot);
        if (!accountId) {
            debug('No Expo account available to create a signed tunnel URL; user is likely logged out.');
            return null;
        }
        const { url } = await _TunnelMutation.TunnelMutation.createSignedTunnelUrlAsync(accountId);
        debug('Created signed tunnel URL for account:', accountId);
        return url;
    } catch (error) {
        debug('Failed to create a signed tunnel URL:', error);
        return null;
    }
}

//# sourceMappingURL=AsyncWsTunnel.js.map