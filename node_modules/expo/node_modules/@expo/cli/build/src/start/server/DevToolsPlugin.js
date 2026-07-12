"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DevToolsPlugin", {
    enumerable: true,
    get: function() {
        return DevToolsPlugin;
    }
});
function _nodefs() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:fs"));
    _nodefs = function() {
        return data;
    };
    return data;
}
const _DevToolsPluginschema = require("./DevToolsPlugin.schema");
const _DevToolsPluginCliExtensionExecutor = require("./DevToolsPluginCliExtensionExecutor");
const _DevToolsPluginManager = require("./DevToolsPluginManager");
const _dir = require("../../utils/dir");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const maybeRealpath = (target)=>{
    try {
        return _nodefs().default.realpathSync(target);
    } catch  {
        return target;
    }
};
class DevToolsPlugin {
    constructor(plugin, projectRoot){
        this.plugin = plugin;
        this.projectRoot = projectRoot;
        this._executor = undefined;
        const result = _DevToolsPluginschema.PluginSchema.safeParse(plugin);
        if (!result.success) {
            throw new Error(`Invalid plugin configuration: ${result.error.message}`, {
                cause: result.error
            });
        }
        if (plugin.webpageRoot != null) {
            const webpageRoot = maybeRealpath(plugin.webpageRoot);
            if (!(0, _dir.isPathInside)(webpageRoot, plugin.packageRoot)) {
                throw new Error(`webpageRoot (${plugin.webpageRoot}) is not inside packageRoot (${plugin.packageRoot}).`);
            }
        }
    }
    get packageName() {
        return this.plugin.packageName;
    }
    get packageRoot() {
        return this.plugin.packageRoot;
    }
    get webpageEndpoint() {
        var _this_plugin, _this_plugin1;
        return ((_this_plugin = this.plugin) == null ? void 0 : _this_plugin.webpageRoot) ? `${_DevToolsPluginManager.DevToolsPluginEndpoint}/${(_this_plugin1 = this.plugin) == null ? void 0 : _this_plugin1.packageName}` : undefined;
    }
    get webpageRoot() {
        var _this_plugin;
        return (_this_plugin = this.plugin) == null ? void 0 : _this_plugin.webpageRoot;
    }
    get description() {
        var _this_plugin_cliExtensions;
        return ((_this_plugin_cliExtensions = this.plugin.cliExtensions) == null ? void 0 : _this_plugin_cliExtensions.description) ?? '';
    }
    get cliExtensions() {
        return this.plugin.cliExtensions;
    }
    get executor() {
        var _this_plugin_cliExtensions;
        if (!((_this_plugin_cliExtensions = this.plugin.cliExtensions) == null ? void 0 : _this_plugin_cliExtensions.entryPoint)) {
            return undefined;
        }
        if (!this._executor) {
            this._executor = new _DevToolsPluginCliExtensionExecutor.DevToolsPluginCliExtensionExecutor(this.plugin, this.projectRoot);
        }
        return this._executor;
    }
}

//# sourceMappingURL=DevToolsPlugin.js.map