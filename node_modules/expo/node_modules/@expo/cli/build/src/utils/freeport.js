"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    freePortAsync: function() {
        return freePortAsync;
    },
    testPortAsync: function() {
        return testPortAsync;
    }
});
function _nodenet() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:net"));
    _nodenet = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function testHostPortAsync(port, host) {
    return new Promise((resolve)=>{
        const server = _nodenet().default.createServer();
        server.listen({
            port,
            host
        }, ()=>{
            server.once('close', ()=>{
                setTimeout(()=>resolve(true), 0);
            });
            server.close();
        });
        server.once('error', (_error)=>{
            setTimeout(()=>resolve(false), 0);
        });
    });
}
async function testPortAsync(port, hostnames) {
    if (!(hostnames == null ? void 0 : hostnames.length)) {
        hostnames = [
            null
        ];
    }
    for (const host of hostnames){
        if (!await testHostPortAsync(port, host)) {
            return false;
        }
    }
    return true;
}
async function freePortAsync(portStart, hostnames) {
    for(let port = portStart; port <= 65535; port++){
        if (await testPortAsync(port, hostnames)) {
            return port;
        }
    }
    return null;
}

//# sourceMappingURL=freeport.js.map