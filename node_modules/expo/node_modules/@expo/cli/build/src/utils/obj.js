/** `lodash.get` */ "use strict";
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
    get get () {
        return get;
    },
    get pickBy () {
        return pickBy;
    },
    get set () {
        return set;
    }
});
function get(obj, key) {
    const branches = key.split('.');
    let current = obj;
    let branch;
    while(branch = branches.shift()){
        if (!(branch in current)) {
            return null;
        }
        current = current[branch];
    }
    return current;
}
function set(obj, key, value) {
    const branches = key.split('.');
    let current = obj;
    let branch;
    while(branch = branches.shift()){
        if (branches.length === 0) {
            current[branch] = value;
            return obj;
        }
        if (!(branch in current)) {
            current[branch] = {};
        }
        current = current[branch];
    }
    return null;
}
function pickBy(obj, predicate) {
    return Object.entries(obj).reduce((acc, [key, value])=>{
        if (predicate(value, key)) {
            acc[key] = value;
        }
        return acc;
    }, {});
}

//# sourceMappingURL=obj.js.map