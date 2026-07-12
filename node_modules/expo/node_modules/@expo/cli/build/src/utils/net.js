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
    get isLocalSocket () {
        return isLocalSocket;
    },
    get isMatchingOrigin () {
        return isMatchingOrigin;
    },
    get shouldThrottleRemoteDevCall () {
        return shouldThrottleRemoteDevCall;
    }
});
const ipv6To4Prefix = '::ffff:';
const isLocalSocket = (socket)=>{
    let { localAddress, remoteAddress, remoteFamily } = socket;
    const isLoopbackRequest = localAddress && localAddress === remoteAddress;
    if (isLoopbackRequest) {
        return true;
    } else if (!remoteAddress || !remoteFamily) {
        return false;
    }
    if (remoteFamily === 'IPv6' && remoteAddress.startsWith(ipv6To4Prefix)) {
        remoteAddress = remoteAddress.slice(ipv6To4Prefix.length);
    }
    return remoteAddress === '::1' || remoteAddress.startsWith('127.');
};
const isMatchingOrigin = (request, serverBaseUrl)=>{
    // NOTE(@kitten): The browser will always send an origin header for websocket upgrade connections
    if (!request.headers.origin) {
        return true;
    }
    let actualHost;
    try {
        actualHost = new URL(`${request.headers.origin}`).host;
    } catch  {
        // Malformed Origin — treat as untrusted.
        return false;
    }
    const expectedHost = new URL(serverBaseUrl).host;
    return actualHost === expectedHost;
};
const DEV_CALL_THROTTLE_MS = 2000;
let lastRemoteDevCallAt = 0;
const shouldThrottleRemoteDevCall = ()=>{
    const now = Date.now();
    if (now - lastRemoteDevCallAt < DEV_CALL_THROTTLE_MS) {
        return true;
    }
    lastRemoteDevCallAt = now;
    return false;
};

//# sourceMappingURL=net.js.map