"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "toPosixPath", {
    enumerable: true,
    get: function() {
        return toPosixPath;
    }
});
const REGEXP_REPLACE_SLASHES = /\\/g;
function toPosixPath(filePath) {
    return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}

//# sourceMappingURL=filePath.js.map