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
    get getGateway () {
        return getGateway;
    },
    get getGatewayAsync () {
        return getGatewayAsync;
    },
    get getIpAddressAsync () {
        return getIpAddressAsync;
    }
});
function _lannetwork() {
    const data = require("lan-network");
    _lannetwork = function() {
        return data;
    };
    return data;
}
const _env = require("./env");
// NOTE(@kitten): In headless mode, there's no point in trying to run DHCP, since
// we assume we're online and probing is going to be enough
const options = {
    noDhcp: (0, _env.envIsHeadless)()
};
function getGateway() {
    try {
        return (0, _lannetwork().lanNetworkSync)(options);
    } catch  {
        return {
            iname: null,
            address: '127.0.0.1',
            gateway: null,
            internal: true
        };
    }
}
async function getGatewayAsync() {
    try {
        return await (0, _lannetwork().lanNetwork)(options);
    } catch  {
        return {
            iname: null,
            address: '127.0.0.1',
            gateway: null,
            internal: true
        };
    }
}
async function getIpAddressAsync() {
    return (await getGatewayAsync()).address;
}

//# sourceMappingURL=ip.js.map