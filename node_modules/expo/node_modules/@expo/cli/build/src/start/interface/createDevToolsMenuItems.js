"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createDevToolsMenuItems", {
    enumerable: true,
    get: function() {
        return createDevToolsMenuItems;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
const _cliExtensionMenuItemHandler = require("./cliExtensionMenuItemHandler");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _open = require("../../utils/open");
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
const debug = require('debug')('expo:start:devtools');
const createDevToolsMenuItems = (plugins, defaultServerUrl, metroServerOrigin, cliExtensionMenuItemHandlerFunc = _cliExtensionMenuItemHandler.cliExtensionMenuItemHandler, openBrowserAsyncFunc = _open // Used for injection when testing
.openBrowserAsync)=>{
    return plugins.map((plugin)=>{
        const commands = getCliExtensionCommands(plugin);
        if (commands.length > 0 && plugin.webpageEndpoint) {
            // Custom display/handling for plugins that support both web and CLI commands
            const children = [
                devtoolFactory(plugin, defaultServerUrl, openBrowserAsyncFunc),
                ...commands.map((descriptor)=>({
                        title: descriptor.title,
                        value: descriptor.name,
                        action: async ()=>await cliExtensionMenuItemHandlerFunc(plugin, descriptor, metroServerOrigin)
                    }))
            ].filter((item)=>item != null);
            return {
                title: (0, _chalk().default)`{bold ${plugin.packageName}}`,
                value: '',
                children,
                action: async ()=>{
                    try {
                        var _children_find_action, _children_find;
                        const value = await (0, _prompts.selectAsync)((0, _chalk().default)`{dim Select command}`, children);
                        await ((_children_find = children.find((item)=>item.value === value)) == null ? void 0 : (_children_find_action = _children_find.action) == null ? void 0 : _children_find_action.call(_children_find));
                    } catch (error) {
                        // Handle aborting prompt
                        debug(`Aborted selection prompt by user: ${error.toString()}`);
                    }
                }
            };
        } else if (plugin.webpageEndpoint) {
            return devtoolFactory(plugin, defaultServerUrl);
        } else if (plugin.cliExtensions && commands.length > 0) {
            return cliExtensionFactory(plugin, metroServerOrigin);
        }
        return null;
    }).filter((menuItem)=>menuItem != null);
};
const devtoolFactory = (plugin, defaultServerUrl, openBrowserAsyncFunc = _open // Used for injection when testing
.openBrowserAsync)=>{
    if (plugin.webpageEndpoint == null) {
        return null;
    }
    return {
        title: (0, _chalk().default)`Open {bold ${plugin.packageName}}`,
        value: `devtoolsPlugin:${plugin.packageName}`,
        action: async ()=>{
            const url = new URL(plugin.webpageEndpoint, defaultServerUrl);
            await openBrowserAsyncFunc(url.toString());
        }
    };
};
const getCliExtensionCommands = (plugin)=>{
    const cliExtensionsConfig = plugin.cliExtensions;
    const commands = ((cliExtensionsConfig == null ? void 0 : cliExtensionsConfig.commands) ?? []).filter((p)=>{
        var _p_environments;
        return (_p_environments = p.environments) == null ? void 0 : _p_environments.includes('cli');
    });
    if (cliExtensionsConfig == null || commands.length === 0) {
        return [];
    }
    return commands;
};
const cliExtensionFactory = (plugin, metroServerOrigin, cliExtensionMenuItemHandlerFunc = _cliExtensionMenuItemHandler // Used for injection when testing
.cliExtensionMenuItemHandler)=>{
    const commands = getCliExtensionCommands(plugin);
    const children = commands.map((cmd)=>({
            title: cmd.title,
            value: cmd.name
        }));
    return {
        title: (0, _chalk().default)`{bold ${plugin.packageName}}`,
        value: `cliExtension:${plugin.packageName}`,
        children,
        action: async ()=>{
            try {
                const value = await (0, _prompts.selectAsync)((0, _chalk().default)`{dim Select command}`, children);
                const cmd = commands.find((c)=>c.name === value);
                if (cmd == null) {
                    _log.warn(`No command found for ${plugin.packageName}`);
                } else {
                    await cliExtensionMenuItemHandlerFunc(plugin, cmd, metroServerOrigin);
                }
            } catch (error) {
                // Handle aborting prompt
                debug(`Failed to execute command: ${error.toString()}`);
            }
        }
    };
};

//# sourceMappingURL=createDevToolsMenuItems.js.map