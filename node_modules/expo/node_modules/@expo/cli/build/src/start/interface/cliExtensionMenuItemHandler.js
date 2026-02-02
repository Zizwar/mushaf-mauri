"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cliExtensionMenuItemHandler", {
    enumerable: true,
    get: function() {
        return cliExtensionMenuItemHandler;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _link = require("../../utils/link");
const _ora = require("../../utils/ora");
const _prompts = require("../../utils/prompts");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const cliExtensionMenuItemHandler = async (plugin, command, metroServerOrigin)=>{
    const cliExtensionsConfig = plugin.cliExtensions;
    if (cliExtensionsConfig == null) {
        return;
    }
    if (plugin.executor == null) {
        _log.warn((0, _chalk().default)`{bold ${plugin.packageName}} does not support CLI commands.`);
        return;
    }
    let args = {};
    if (command.parameters && command.parameters.length > 0) {
        args = await command.parameters.reduce(async (accPromise, param)=>{
            const acc = await accPromise;
            const result = await (0, _prompts.promptAsync)({
                name: param.name,
                type: param.type,
                message: `${param.name}${param.description ? (0, _chalk().default)` {dim ${param.description}}` : ''}` + (0, _chalk().default)` {dim (${param.type})}`
            });
            if (result[param.name] == null) {
                throw new Error('Input cancelled');
            }
            return {
                ...acc,
                [param.name]: result[param.name]
            };
        }, Promise.resolve({}));
    }
    // Confirm execution
    const { value } = await (0, _prompts.promptAsync)({
        message: (0, _chalk().default)`{dim Execute command "${command.title}":} "${plugin.executor.getCommandString({
            command: command.name,
            args
        })}"`,
        initial: false,
        name: 'value',
        type: 'confirm'
    });
    if (!value) {
        return;
    }
    const spinnerText = `Executing command '${command.title}'`;
    const spinner = (0, _ora.ora)(spinnerText).start();
    try {
        // Execute and stream the output
        const results = await plugin.executor.execute({
            command: command.name,
            metroServerOrigin,
            args,
            onOutput: (output)=>handleOutput(output, spinner)
        });
        // Format with warning or success depending on wether the client reported any errors
        formatResults(command.title, results, spinner);
    } catch (error) {
        spinner.fail(`Failed to execute command "${command.title}".\n${error.toString().trim()}`);
    }
};
//*************************** Helpers ****************************/
function normalizeText(text, level) {
    const trimText = text.trim();
    if (level === 'error') {
        return _chalk().default.red(trimText);
    } else if (level === 'warning') {
        return _chalk().default.yellow(trimText);
    } else {
        return trimText;
    }
}
function appendSpinnerText(text, spinner) {
    return spinner.text += '\n  ' + text;
}
function handleOutput(output, spinner) {
    output.forEach((line)=>{
        switch(line.type){
            case 'text':
                appendSpinnerText(line.url ? (0, _link.link)(line.url, {
                    text: normalizeText(line.text, line.level),
                    dim: false
                }) : normalizeText(line.text, line.level), spinner);
                break;
            case 'audio':
                appendSpinnerText((0, _link.link)(line.url, {
                    text: line.text ?? 'Audio',
                    dim: false
                }), spinner);
                break;
            case 'image':
                appendSpinnerText((0, _link.link)(line.url, {
                    text: line.text ?? 'Image',
                    dim: false
                }), spinner);
                break;
        }
    });
}
function formatResults(command, results, spinner) {
    const output = spinner.text.split('\n').slice(1).join('\n');
    if (results.find((line)=>line.type === 'text' && line.level === 'error')) {
        spinner.fail(`Command "${command}" completed with errors.\n${output}`);
    } else if (results.find((line)=>line.type === 'text' && line.level === 'warning')) {
        spinner.warn(`Command "${command}" completed with warnings.\n${output}`);
    } else {
        spinner.succeed(`Command "${command}" completed successfully.\n${output}`).stop();
    }
}

//# sourceMappingURL=cliExtensionMenuItemHandler.js.map