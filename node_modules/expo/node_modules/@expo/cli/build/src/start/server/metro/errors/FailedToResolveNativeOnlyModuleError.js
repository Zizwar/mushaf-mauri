"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FailedToResolveNativeOnlyModuleError", {
    enumerable: true,
    get: function() {
        return FailedToResolveNativeOnlyModuleError;
    }
});
class FailedToResolveNativeOnlyModuleError extends Error {
    constructor(moduleName, relativePath){
        super(`Importing native-only module "${moduleName}" on web from: ${relativePath}`);
    }
}

//# sourceMappingURL=FailedToResolveNativeOnlyModuleError.js.map