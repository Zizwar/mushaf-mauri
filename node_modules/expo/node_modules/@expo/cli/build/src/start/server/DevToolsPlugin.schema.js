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
    get DevToolsPluginOutputSchema () {
        return DevToolsPluginOutputSchema;
    },
    get PluginSchema () {
        return PluginSchema;
    }
});
function _zod() {
    const data = require("zod");
    _zod = function() {
        return data;
    };
    return data;
}
const CommandParameterSchema = _zod().z.object({
    name: _zod().z.string().min(1),
    type: _zod().z.enum([
        'text',
        'number',
        'confirm'
    ]),
    description: _zod().z.string().optional()
});
const CommandSchema = _zod().z.object({
    name: _zod().z.string().min(1),
    title: _zod().z.string().min(1),
    environments: _zod().z.array(_zod().z.enum([
        'cli',
        'mcp'
    ])).readonly(),
    parameters: _zod().z.array(CommandParameterSchema).optional()
});
const CliExtensionsSchema = _zod().z.object({
    description: _zod().z.string(),
    commands: _zod().z.array(CommandSchema).min(1),
    entryPoint: _zod().z.string().min(1)
});
const PluginSchema = _zod().z.object({
    packageName: _zod().z.string().min(1),
    packageRoot: _zod().z.string().min(1),
    webpageRoot: _zod().z.string().optional(),
    cliExtensions: CliExtensionsSchema.optional()
});
const DevToolsPluginOutputLinesSchema = _zod().z.union([
    _zod().z.object({
        type: _zod().z.literal('text'),
        text: _zod().z.string(),
        url: _zod().z.string().optional(),
        level: _zod().z.enum([
            'info',
            'warning',
            'error'
        ])
    }),
    _zod().z.object({
        type: _zod().z.literal('audio'),
        url: _zod().z.string().url(),
        text: _zod().z.string().optional()
    }),
    _zod().z.object({
        type: _zod().z.literal('image'),
        url: _zod().z.string().url(),
        text: _zod().z.string().optional()
    })
]);
const DevToolsPluginOutputSchema = _zod().z.array(DevToolsPluginOutputLinesSchema);

//# sourceMappingURL=DevToolsPlugin.schema.js.map