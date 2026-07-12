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
    get extractAsync () {
        return extractAsync;
    },
    get extractStream () {
        return extractStream;
    }
});
function _multitars() {
    const data = require("multitars");
    _multitars = function() {
        return data;
    };
    return data;
}
function _nodecrypto() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:crypto"));
    _nodecrypto = function() {
        return data;
    };
    return data;
}
function _nodefs() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:fs"));
    _nodefs = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
function _nodestream() {
    const data = require("node:stream");
    _nodestream = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:utils:tar');
class ChecksumStream extends TransformStream {
    constructor(algorithm){
        super({
            transform: (chunk, controller)=>{
                this.hash.update(chunk);
                controller.enqueue(chunk);
            }
        });
        this.hash = _nodecrypto().default.createHash(algorithm);
    }
    digest(encoding) {
        return this.hash.digest(encoding);
    }
}
async function extractStream(input, targetOutput, options = {}) {
    const output = _nodepath().default.resolve(targetOutput) + _nodepath().default.sep;
    await _nodefs().default.promises.mkdir(output, {
        recursive: true
    });
    const { checksumAlgorithm, strip = 0, rename, filter } = options;
    const checksumStream = new ChecksumStream(checksumAlgorithm || 'md5');
    const decompressionStream = new DecompressionStream('gzip');
    const body = input.pipeThrough(checksumStream).pipeThrough(decompressionStream);
    for await (const file of (0, _multitars().untar)(body)){
        let name = _nodepath().default.normalize(file.name);
        if (filter && !filter(name, file.typeflag)) {
            debug(`filtered: ${_nodepath().default.resolve(output, name)}`);
            continue;
        } else if (rename) {
            name = rename(name, file.typeflag) ?? name;
        }
        for(let idx = 0; idx < strip; idx++){
            const sepIdx = name.indexOf(_nodepath().default.sep);
            if (sepIdx > -1) {
                name = name.slice(sepIdx + 1);
            } else {
                break;
            }
        }
        const resolved = _nodepath().default.resolve(output, name);
        if (!resolved.startsWith(output)) {
            debug(`skip: ${resolved}`);
            continue;
        }
        const parent = _nodepath().default.dirname(resolved);
        if (parent !== output) {
            let exists = false;
            try {
                const stat = await _nodefs().default.promises.lstat(parent);
                if (stat.isSymbolicLink() || !stat.isDirectory() && !stat.isFile()) {
                    debug(`skip: ${resolved}`);
                    continue;
                } else if (stat.isDirectory()) {
                    exists = true;
                }
            } catch  {}
            if (!exists) {
                debug(`mkdir(p): ${parent}`);
                await _nodefs().default.promises.mkdir(parent, {
                    recursive: true
                });
            }
        }
        switch(file.typeflag){
            case _multitars().TarTypeFlag.FILE:
                debug(`write(${file.mode.toString(8)}): ${resolved}`);
                await _nodefs().default.promises.writeFile(resolved, (0, _multitars().streamToAsyncIterable)(file.stream()), {
                    mode: file.mode
                });
                break;
            case _multitars().TarTypeFlag.DIRECTORY:
                debug(`mkdir(${file.mode.toString(8)}): ${resolved}`);
                try {
                    await _nodefs().default.promises.mkdir(resolved, {
                        mode: file.mode
                    });
                } catch (error) {
                    if (error.code !== 'EEXIST') {
                        throw error;
                    }
                }
                break;
            case _multitars().TarTypeFlag.SYMLINK:
            case _multitars().TarTypeFlag.LINK:
                {
                    const target = _nodepath().default.resolve(parent, file.linkname ?? '');
                    if (!target.startsWith(output) || target === parent) {
                        debug(`skip: ${resolved} -> ${target}`);
                        continue;
                    }
                    if (file.typeflag === _multitars().TarTypeFlag.LINK) {
                        debug(`link: ${resolved} -> ${target}`);
                        await _nodefs().default.promises.link(target, resolved);
                    } else {
                        const stat = await _nodefs().default.promises.lstat(target).catch(()=>null);
                        const type = (stat == null ? void 0 : stat.isDirectory()) ? 'dir' : 'file';
                        debug(`symlink(${type}): ${resolved} -> ${target}`);
                        await _nodefs().default.promises.symlink(target, resolved, type);
                    }
                    break;
                }
        }
    }
    return checksumStream.digest('hex');
}
async function extractAsync(input, output, options) {
    await extractStream(_nodestream().Readable.toWeb(_nodefs().default.createReadStream(input)), output, options);
}

//# sourceMappingURL=tar.js.map