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
    get NgrokResolver () {
        return NgrokResolver;
    },
    get isNgrokClientError () {
        return isNgrokClientError;
    }
});
const _ExternalModule = require("./ExternalModule");
class NgrokResolver extends _ExternalModule.ExternalModule {
    constructor(projectRoot){
        super(projectRoot, {
            name: '@expo/ngrok',
            versionRange: '^4.1.0'
        }, (packageName)=>`The package ${packageName} is required to use tunnels, would you like to install it globally?`);
    }
}
function isNgrokClientError(error) {
    var _error_body;
    return error == null ? void 0 : (_error_body = error.body) == null ? void 0 : _error_body.msg;
}

//# sourceMappingURL=NgrokResolver.js.map