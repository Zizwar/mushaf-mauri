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
    get NETWORK_RESPONSE_STORAGE () {
        return NETWORK_RESPONSE_STORAGE;
    },
    get NetworkResponseHandler () {
        return NetworkResponseHandler;
    },
    get recordNetworkResponse () {
        return recordNetworkResponse;
    }
});
const _MessageHandler = require("../MessageHandler");
const NETWORK_RESPONSE_STORAGE = new Map();
// Bounded so an unauthenticated client on `/inspector/network` cannot grow this
// map without limit. `Map` preserves insertion order, so the first key is the
// oldest entry — drop it on overflow (FIFO).
const MAX_NETWORK_RESPONSES = 512;
function recordNetworkResponse(requestId, info) {
    NETWORK_RESPONSE_STORAGE.set(requestId, info);
    if (NETWORK_RESPONSE_STORAGE.size > MAX_NETWORK_RESPONSES) {
        const oldestKey = NETWORK_RESPONSE_STORAGE.keys().next().value;
        if (oldestKey !== undefined) {
            NETWORK_RESPONSE_STORAGE.delete(oldestKey);
        }
    }
}
class NetworkResponseHandler extends _MessageHandler.MessageHandler {
    handleDeviceMessage(message) {
        if (message.method === 'Expo(Network.receivedResponseBody)') {
            const { requestId, ...requestInfo } = message.params;
            recordNetworkResponse(requestId, requestInfo);
            return true;
        }
        return false;
    }
    handleDebuggerMessage(message) {
        if (message.method === 'Network.getResponseBody' && this.storage.has(message.params.requestId)) {
            return this.sendToDebugger({
                id: message.id,
                result: this.storage.get(message.params.requestId)
            });
        }
        return false;
    }
    constructor(...args){
        super(...args), /** All known responses, mapped by request id */ this.storage = NETWORK_RESPONSE_STORAGE;
    }
}

//# sourceMappingURL=NetworkResponse.js.map