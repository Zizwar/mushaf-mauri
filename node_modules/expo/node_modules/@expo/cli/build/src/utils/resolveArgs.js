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
    _resolveStringOrBooleanArgs: function() {
        return _resolveStringOrBooleanArgs;
    },
    assertDuplicateArgs: function() {
        return assertDuplicateArgs;
    },
    assertNonBooleanArg: function() {
        return assertNonBooleanArg;
    },
    assertUnknownArgs: function() {
        return assertUnknownArgs;
    },
    collapseAliases: function() {
        return collapseAliases;
    },
    resolveCustomBooleanArgsAsync: function() {
        return resolveCustomBooleanArgsAsync;
    },
    resolveStringOrBooleanArgsAsync: function() {
        return resolveStringOrBooleanArgsAsync;
    }
});
const _array = require("./array");
const _errors = require("./errors");
/** Convert ExtraArgsSpec to arg.Spec (for validation) and extract allowedValues */ function parseExtraArgMap(extraArgMap) {
    const spec = {};
    const allowedValues = {};
    for (const [key, value] of Object.entries(extraArgMap)){
        if (typeof value === 'string') {
            // Alias (e.g. '-f': '--flag')
            spec[key] = value;
        } else if (Array.isArray(value)) {
            // Tuple [Boolean, ...strings] - Boolean is enforced by the type, but check at runtime too
            const [first, ...stringValues] = value;
            if (first !== Boolean) {
                throw new _errors.CommandError('BAD_ARGS', `Invalid extraArgMap spec for ${key}: first element must be Boolean`);
            }
            spec[key] = Boolean;
            allowedValues[key] = [
                'true',
                'false',
                ...stringValues
            ];
        } else {
            // Boolean - any value allowed
            spec[key] = Boolean;
        }
    }
    return {
        spec,
        allowedValues
    };
}
/** Split up arguments that are formatted like `--foo=bar` or `-f="bar"` to `['--foo', 'bar']` */ function splitArgs(args) {
    const result = [];
    for (const arg of args){
        if (arg.startsWith('-')) {
            const [key, ...props] = arg.split('=');
            result.push(key);
            if (props.length) {
                result.push(props.join('='));
            }
        } else {
            result.push(arg);
        }
    }
    return result;
}
async function resolveStringOrBooleanArgsAsync(argv, rawArgMap, extraArgMap) {
    let args = splitArgs(argv);
    const { spec: extraArgSpec, allowedValues } = parseExtraArgMap(extraArgMap);
    const combinedSpec = {
        ...rawArgMap,
        ...extraArgSpec
    };
    // Assert any missing arguments
    assertUnknownArgs(combinedSpec, args);
    // Collapse aliases into fully qualified arguments.
    args = collapseAliases(combinedSpec, args);
    // Filter out array-type arguments so _resolveStringOrBooleanArgs can process the rest.
    // This is necessary because _resolveStringOrBooleanArgs can't handle array-type args like --platform.
    const filteredArgs = filterOutArrayArgs(args, combinedSpec);
    // Resolve all of the string or boolean arguments and the project root.
    return _resolveStringOrBooleanArgs(combinedSpec, filteredArgs, allowedValues);
}
async function resolveCustomBooleanArgsAsync(argv, rawArgMap, extraArgMap) {
    const results = await resolveStringOrBooleanArgsAsync(argv, rawArgMap, extraArgMap);
    return {
        ...results,
        args: Object.fromEntries(Object.entries(results.args).map(([key, value])=>{
            // Skip aliases (e.g. '-f': '--flag') - only process actual flags
            const extraArgValue = extraArgMap[key];
            if (extraArgValue && typeof extraArgValue !== 'string') {
                if (typeof value === 'string') {
                    if (![
                        'true',
                        'false'
                    ].includes(value)) {
                        throw new _errors.CommandError('BAD_ARGS', `Invalid boolean argument: ${key}=${value}. Expected one of: true, false`);
                    }
                    return [
                        key,
                        value === 'true'
                    ];
                }
            }
            return [
                key,
                value
            ];
        }))
    };
}
function _resolveStringOrBooleanArgs(arg, args, allowedValues) {
    // Default project root, if a custom one is defined then it will overwrite this.
    let projectRoot = '.';
    // The resolved arguments.
    const settings = {};
    // Create a list of possible arguments, this will filter out aliases.
    const possibleArgs = Object.entries(arg).filter(([, value])=>typeof value !== 'string').map(([key])=>key);
    // Check if a value is allowed for a given flag
    const isAllowedValue = (flag, value)=>{
        if (!allowedValues || !allowedValues[flag]) {
            return true; // No restrictions, allow any value
        }
        return allowedValues[flag].includes(value);
    };
    // Loop over arguments in reverse order so we can resolve if a value belongs to a flag.
    for(let i = args.length - 1; i > -1; i--){
        const value = args[i];
        // At this point we should have converted all aliases to fully qualified arguments.
        if (value.startsWith('--')) {
            // If we ever find an argument then it must be a boolean because we are checking in reverse
            // and removing arguments from the array if we find a string.
            // We don't override arguments that are already set
            if (!(value in settings)) {
                settings[value] = true;
            }
        } else {
            // Get the previous argument in the array.
            const nextValue = i > 0 ? args[i - 1] : null;
            if (nextValue && possibleArgs.includes(nextValue) && isAllowedValue(nextValue, value)) {
                // We don't override arguments that are already set
                if (!(nextValue in settings)) {
                    settings[nextValue] = value;
                }
                i--;
            } else if (// If the last value is not a flag and it doesn't have a recognized flag before it (instead having a string value or nothing)
            // then it must be the project root.
            i === args.length - 1) {
                projectRoot = value;
            } else {
                // This will asserts if two strings are passed in a row and not at the end of the line.
                throw new _errors.CommandError('BAD_ARGS', `Unknown argument: ${value}`);
            }
        }
    }
    return {
        args: settings,
        projectRoot
    };
}
function collapseAliases(arg, args) {
    const aliasMap = getAliasTuples(arg);
    for (const [arg, alias] of aliasMap){
        args = (0, _array.replaceAllValues)(args, arg, alias);
    }
    // Assert if there are duplicate flags after we collapse the aliases.
    // Skip array-type arguments (like --platform) which can have multiple values.
    assertDuplicateArgs(args, aliasMap, arg);
    return args;
}
function assertUnknownArgs(arg, args) {
    const allowedArgs = Object.keys(arg);
    const unknownArgs = args.filter((arg)=>!allowedArgs.includes(arg) && arg.startsWith('-'));
    if (unknownArgs.length > 0) {
        throw new _errors.CommandError(`Unknown arguments: ${unknownArgs.join(', ')}`);
    }
}
function getAliasTuples(arg) {
    return Object.entries(arg).filter(([, value])=>typeof value === 'string');
}
/** Filter out array-type arguments from the spec (and their values).
 * This is needed because _resolveStringOrBooleanArgs can't handle array args like --platform.
 */ function filterOutArrayArgs(args, spec) {
    // Get the set of flag names that are array types
    const arrayFlags = new Set(Object.entries(spec).filter(([, value])=>Array.isArray(value)).map(([key])=>key));
    if (arrayFlags.size === 0) {
        return args;
    }
    const result = [];
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (arrayFlags.has(arg)) {
            // Skip this flag and its value if it has one
            if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                i++;
            }
        } else {
            result.push(arg);
        }
    }
    return result;
}
function assertDuplicateArgs(args, argNameAliasTuple, spec) {
    for (const [argName, argNameAlias] of argNameAliasTuple){
        // Skip array-type arguments (like --platform) which can have multiple values
        if (spec && Array.isArray(spec[argNameAlias])) {
            continue;
        }
        if (args.filter((a)=>[
                argName,
                argNameAlias
            ].includes(a)).length > 1) {
            throw new _errors.CommandError('BAD_ARGS', `Can only provide one instance of ${argName} or ${argNameAlias}`);
        }
    }
}
function assertNonBooleanArg(argName, arg) {
    if (arg == null || typeof arg === 'boolean') {
        throw new _errors.CommandError('BAD_ARGS', `Expected input for arg ${argName}`);
    }
}

//# sourceMappingURL=resolveArgs.js.map