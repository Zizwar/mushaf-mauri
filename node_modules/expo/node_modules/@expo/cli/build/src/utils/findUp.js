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
    get findFileInParents () {
        return findFileInParents;
    },
    get findUpProjectRootOrAssert () {
        return findUpProjectRootOrAssert;
    }
});
function _fs() {
    const data = /*#__PURE__*/ _interop_require_default(require("fs"));
    _fs = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
const _errors = require("../utils/errors");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function findUpProjectRootOrAssert(cwd) {
    const projectRoot = findUpProjectRoot(cwd);
    if (!projectRoot) {
        throw new _errors.CommandError(`Project root directory not found (working directory: ${cwd})`);
    }
    return _path().default.dirname(projectRoot);
}
function findUpProjectRoot(root) {
    return findFileInParents(root, 'package.json');
}
function findFileInParents(root, fileName) {
    for(let dir = root; _path().default.dirname(dir) !== dir; dir = _path().default.dirname(dir)){
        const file = _path().default.resolve(dir, fileName);
        if (_fs().default.existsSync(file)) {
            return file;
        }
    }
    return null;
}

//# sourceMappingURL=findUp.js.map