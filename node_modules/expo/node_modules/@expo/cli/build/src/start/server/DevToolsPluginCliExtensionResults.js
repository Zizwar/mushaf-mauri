"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DevToolsPluginCliExtensionResults", {
    enumerable: true,
    get: function() {
        return DevToolsPluginCliExtensionResults;
    }
});
function _nodebuffer() {
    const data = require("node:buffer");
    _nodebuffer = function() {
        return data;
    };
    return data;
}
const _DevToolsPluginschema = require("./DevToolsPlugin.schema");
// Cap accumulated output at V8's max single-string length to bound heap growth.
const MAX_OUTPUT_LENGTH = _nodebuffer().constants.MAX_STRING_LENGTH;
class DevToolsPluginCliExtensionResults {
    constructor(onOutput){
        this.onOutput = onOutput;
        this._output = [];
        this._totalLength = 0;
        this._truncated = false;
    }
    append(output, level = 'info') {
        if (this._truncated) return;
        if (this._totalLength + output.length > MAX_OUTPUT_LENGTH) {
            this._truncated = true;
            const message = {
                type: 'text',
                text: `Output truncated: plugin exceeded V8's max string length (${MAX_OUTPUT_LENGTH} chars). Reduce output, paginate, or write to a file.`,
                level: 'error'
            };
            this._output.push(message);
            this.onOutput == null ? void 0 : this.onOutput.call(this, [
                message
            ]);
            return;
        }
        this._totalLength += output.length;
        const results = this.parseOutputText(output, level);
        this._output.push(...results);
        this.onOutput == null ? void 0 : this.onOutput.call(this, results);
    }
    isTruncated() {
        return this._truncated;
    }
    exit(code) {
        if (code === 0) return;
        this.append(`Process exited with code ${code}`, 'error');
    }
    getOutput() {
        return this._output;
    }
    parseOutputText(txt, level = 'info') {
        // Validate against schema
        try {
            const result = _DevToolsPluginschema.DevToolsPluginOutputSchema.safeParse(JSON.parse(txt));
            if (!result.success) {
                return [
                    {
                        type: 'text',
                        text: `Invalid JSON: ${result.error.issues.map((issue)=>issue.message).join(', ')}`,
                        level: 'error'
                    }
                ];
            }
            return result.data;
        } catch  {
            // Not JSON, treat as plain text
            const lines = txt.split('\n');
            const results = [];
            for (const line of lines){
                if (line) {
                    results.push({
                        type: 'text',
                        text: line,
                        level
                    });
                }
            }
            return results;
        }
    }
}

//# sourceMappingURL=DevToolsPluginCliExtensionResults.js.map