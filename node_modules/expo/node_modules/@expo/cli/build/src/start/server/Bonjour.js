"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Bonjour", {
    enumerable: true,
    get: function() {
        return Bonjour;
    }
});
function _config() {
    const data = require("@expo/config");
    _config = function() {
        return data;
    };
    return data;
}
const _env = require("../../utils/env");
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
const debug = require('debug')('expo:start:server:bonjour');
class Bonjour {
    constructor(/** Project root directory */ projectRoot, /** Port to advertise, if any */ port){
        this.projectRoot = projectRoot;
        this.port = port;
    }
    async announceAsync({ exp = (0, _config().getConfig)(this.projectRoot).exp }) {
        var _exp_name, _exp_slug;
        if (_env.env.CI || !_env.env.EXPO_UNSTABLE_BONJOUR) {
            return;
        } else if (!this.port) {
            return;
        }
        const dnssd = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("dnssd-advertise")));
        if (this.stopAdvertising) {
            await this.stopAdvertising();
        }
        debug('Started Bonjour service');
        this.stopAdvertising = dnssd.advertise({
            name: `${exp.name}`,
            type: 'expo',
            protocol: 'tcp',
            hostname: exp.slug,
            port: this.port,
            stack: 'IPv4',
            txt: {
                name: (_exp_name = exp.name) == null ? void 0 : _exp_name.slice(0, 255),
                slug: (_exp_slug = exp.slug) == null ? void 0 : _exp_slug.slice(0, 255)
            }
        });
    }
    async closeAsync() {
        if (!this.stopAdvertising) {
            return false;
        } else {
            debug('Stopped Bonjour service');
            await (this.stopAdvertising == null ? void 0 : this.stopAdvertising.call(this));
            this.stopAdvertising = undefined;
            return true;
        }
    }
}

//# sourceMappingURL=Bonjour.js.map