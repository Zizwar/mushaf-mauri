"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createGlobFilter", {
    enumerable: true,
    get: function() {
        return createGlobFilter;
    }
});
function _picomatch() {
    const data = /*#__PURE__*/ _interop_require_default(require("picomatch"));
    _picomatch = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:file-transform');
function createGlobFilter(globPattern, options) {
    const matcher = (0, _picomatch().default)(globPattern, options);
    debug('filter: created for pattern(s) "%s" (%s)', Array.isArray(globPattern) ? globPattern.join('", "') : globPattern, options);
    return (path)=>{
        const included = matcher(path);
        debug('filter: %s - %s', included ? 'include' : 'exclude', path);
        return included;
    };
}

//# sourceMappingURL=createFileTransform.js.map