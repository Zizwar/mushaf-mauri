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
    get Headers () {
        return _fetchnodeshim().Headers;
    },
    get Response () {
        return _fetchnodeshim().Response;
    },
    get fetch () {
        return _fetchnodeshim().fetch;
    }
});
function _fetchnodeshim() {
    const data = require("fetch-nodeshim");
    _fetchnodeshim = function() {
        return data;
    };
    return data;
}
// NOTE(@kitten): Protect against accidental use of globals that don't match `fetch-nodeshim`
Object.assign(globalThis, {
    fetch: _fetchnodeshim().fetch,
    Blob: _fetchnodeshim().Blob,
    URL: _fetchnodeshim().URL,
    URLSearchParams: _fetchnodeshim().URLSearchParams,
    Request: _fetchnodeshim().Request,
    Response: _fetchnodeshim().Response,
    Headers: _fetchnodeshim().Headers,
    FormData: _fetchnodeshim().FormData
});

//# sourceMappingURL=fetch.js.map