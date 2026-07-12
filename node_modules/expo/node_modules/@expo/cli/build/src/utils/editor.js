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
    get guessEditor () {
        return guessEditor;
    },
    get guessFallbackVisualEditor () {
        return guessFallbackVisualEditor;
    },
    get openInEditorAsync () {
        return openInEditorAsync;
    }
});
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
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
function _nodeprocess() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:process"));
    _nodeprocess = function() {
        return data;
    };
    return data;
}
const _env = require("./env");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../log"));
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
const debug = require('debug')('expo:utils:editor');
// See: https://github.com/sindresorhus/env-editor/blob/3f6aea10ff53910c877b1bf73a8e0c954a5fbf11/index.js
// MIT License, Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
function getEditor(input, allowAnyEditor = false) {
    var _needle_split_pop;
    const needle = input == null ? void 0 : input.trim().toLowerCase();
    if (!needle) {
        return null;
    }
    const id = (_needle_split_pop = needle.split(/[/\\]/).pop()) == null ? void 0 : _needle_split_pop.replace(/\s/g, '-');
    const binary = id == null ? void 0 : id.split('-')[0];
    const editor = EDITORS.find((editor)=>{
        switch(needle){
            case editor.id:
            case editor.name.toLowerCase():
            case editor.binary:
                return true;
            default:
                for (const editorPath of editor.paths){
                    if (_nodepath().default.normalize(needle) === _nodepath().default.normalize(editorPath.toLowerCase())) return true;
                }
                for (const keyword of editor.keywords){
                    if (needle === keyword) return true;
                }
                return false;
        }
    }) ?? (binary ? EDITORS.find((editor)=>editor.binary === binary) : null);
    if (allowAnyEditor && id && binary && !editor) {
        return {
            id,
            name: needle,
            binary,
            isTerminalEditor: false,
            paths: [],
            keywords: []
        };
    }
    return editor || null;
}
function guessEditor() {
    let editor = null;
    if (_env.env.EXPO_EDITOR) {
        editor = getEditor(_env.env.EXPO_EDITOR);
        if (editor) {
            debug('Using $EXPO_EDITOR:', editor.name);
        }
    }
    if (!editor && _nodeprocess().default.env.VISUAL) {
        editor = getEditor(_nodeprocess().default.env.VISUAL);
        if (editor) {
            debug('Using $VISUAL:', editor.name);
        }
    }
    if (!editor && _nodeprocess().default.env.EDITOR) {
        editor = getEditor(_nodeprocess().default.env.EDITOR);
        if (editor) {
            debug('Using $EDITOR:', editor.name);
        }
    }
    return editor;
}
async function guessFallbackVisualEditor() {
    // We search for editors at known `editor.paths`
    for (const editor of VISUAL_EDITORS){
        const target = await editorExistsAtPaths(editor);
        if (target) {
            debug('Found visual editor fallback:', editor.name);
            return {
                ...editor,
                binary: target
            };
        }
    }
    // We search again for a visual editor against `editor.binary` in `$PATH`
    for (const editor of VISUAL_EDITORS){
        const target = await editorExistsInPath(editor);
        if (target) {
            debug('Found visual editor fallback in $PATH:', editor.name);
            return {
                ...editor,
                binary: target
            };
        }
    }
    return null;
}
let _cachedEditor;
async function determineEditorAsync() {
    if (_cachedEditor !== undefined) {
        return _cachedEditor;
    }
    // First: Try to get a known editor
    let editor = guessEditor();
    // Second: If we don't have a known editor, fall back to EXPO_EDITOR / VISUAL resolution
    // We check if the binary in these environment variables exists in the $PATH
    const forceEditorName = _env.env.EXPO_EDITOR ?? _nodeprocess().default.env.VISUAL;
    if (!editor && forceEditorName) {
        const forceEditor = getEditor(forceEditorName, true);
        if (forceEditor && await editorExistsInPath(forceEditor)) {
            editor = forceEditor;
        }
    }
    // Third: Try to find a fallback visual editor, but keep the found one if we can't find a fallback
    if (editor == null ? void 0 : editor.isTerminalEditor) {
        const fallback = await guessFallbackVisualEditor();
        if (fallback) {
            editor = fallback;
        }
    }
    return _cachedEditor = editor;
}
async function openInEditorAsync(path, lineNumber) {
    const editor = await determineEditorAsync();
    if (editor && !editor.isTerminalEditor) {
        const fileReference = lineNumber ? `${path}:${lineNumber}` : path;
        debug(`Opening ${fileReference} in ${editor == null ? void 0 : editor.name} (bin: ${editor == null ? void 0 : editor.binary}, id: ${editor == null ? void 0 : editor.id})`);
        if (editor) {
            try {
                await (0, _spawnasync().default)(editor.binary, getEditorArguments(editor, path, lineNumber), {
                    timeout: 1000
                });
                return true;
            } catch (error) {
                // NOTE(@kitten): The process might explicitly request to be terminated, which is fine
                if ((error == null ? void 0 : error.signal) === 'SIGTERM') {
                    return true;
                }
                debug(`Failed to open ${fileReference} in editor (path: ${path}, binary: ${editor.binary}):`, error);
            }
        }
    }
    _log.error(((editor == null ? void 0 : editor.isTerminalEditor) ? `Could not open ${editor.name} as it's a terminal editor.` : 'Could not open editor.') + `\nYou can set an editor for Expo to open by defining the $EXPO_EDITOR or $VISUAL environment variable (e.g. "vscode" or "atom")`);
    return false;
}
function getEditorArguments(editor, path, lineNumber) {
    switch(editor.id){
        case 'atom':
        case 'sublime':
            return lineNumber ? [
                `${path}:${lineNumber}`
            ] : [
                path
            ];
        case 'emacs':
        case 'emacsforosx':
        case 'nano':
        case 'neovim':
        case 'vim':
            return lineNumber ? [
                `+${lineNumber}`,
                path
            ] : [
                path
            ];
        case 'android-studio':
        case 'intellij':
        case 'textmate':
        case 'webstorm':
        case 'xcode':
            return lineNumber ? [
                `--line=${lineNumber}`,
                path
            ] : [
                path
            ];
        case 'vscode':
        case 'vscodium':
        case 'cursor':
            return lineNumber ? [
                '-g',
                `${path}:${lineNumber}`
            ] : [
                '-g',
                path
            ];
        case 'zed':
            // '-r': Stands for "--reuse" and ensures we don't use the `zed` GUI binary, since the Zed CLI
            // is linked as `zed` into `$PATH` when it's actually the CLI
            return lineNumber ? [
                '-r',
                `${path}:${lineNumber}`
            ] : [
                '-r',
                path
            ];
        default:
            return [
                path
            ];
    }
}
/** Attempt to resolve an editor against $PATH */ async function editorExistsInPath(editor) {
    if (_nodeprocess().default.platform !== 'darwin' && editor.isOSXOnly) {
        return null;
    }
    const binary = editor.binary;
    const paths = (_nodeprocess().default.env.PATH || _nodeprocess().default.env.Path || '').split(_nodepath().default.delimiter).map((target)=>target.trim()).filter((target)=>!!target);
    const exts = _nodeprocess().default.platform === 'win32' ? (_nodeprocess().default.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(_nodepath().default.delimiter).filter(Boolean) : [
        ''
    ];
    const targets = paths.flatMap((dir)=>exts.map((ext)=>_nodepath().default.join(dir, `${binary}${ext}`)));
    for (const target of targets){
        try {
            const mode = _nodeprocess().default.platform === 'win32' ? _nodefs().default.constants.F_OK : _nodefs().default.constants.X_OK;
            await _nodefs().default.promises.access(target, mode);
            return target;
        } catch  {
        // ignore not found and continue
        }
    }
    return null;
}
/** Attempt to resolve an editor against known `paths` */ async function editorExistsAtPaths(editor) {
    // We can skip the path if it's not for our platform (win32 vs posix paths)
    const targets = editor.paths.filter((target)=>target.includes(_nodepath().default.sep));
    for (const target of targets){
        try {
            const mode = _nodeprocess().default.platform === 'win32' ? _nodefs().default.constants.F_OK : _nodefs().default.constants.X_OK;
            await _nodefs().default.promises.access(target, mode);
            return target;
        } catch  {
        // ignore not found and continue
        }
    }
    return null;
}
const TERMINAL_EDITORS = [
    {
        id: 'vim',
        name: 'Vim',
        binary: 'vim',
        isTerminalEditor: true,
        paths: [],
        keywords: [
            'vi'
        ]
    },
    {
        id: 'neovim',
        name: 'NeoVim',
        binary: 'nvim',
        isTerminalEditor: true,
        paths: [],
        keywords: [
            'vim'
        ]
    },
    {
        id: 'nano',
        name: 'GNU nano',
        binary: 'nano',
        isTerminalEditor: true,
        paths: [],
        keywords: []
    },
    {
        id: 'emacs',
        name: 'GNU Emacs',
        binary: 'emacs',
        isTerminalEditor: true,
        paths: [],
        keywords: []
    }
];
const VISUAL_EDITORS = [
    {
        id: 'vscode',
        name: 'Visual Studio Code',
        binary: 'code',
        isTerminalEditor: false,
        paths: [
            '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
        ],
        keywords: [
            'vs code'
        ]
    },
    {
        id: 'vscode-insiders',
        name: 'Visual Studio Code - Insiders',
        binary: 'code-insiders',
        isTerminalEditor: false,
        paths: [
            '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders'
        ],
        keywords: [
            'vs code insiders',
            'code insiders',
            'insiders'
        ]
    },
    {
        id: 'vscodium',
        name: 'VSCodium',
        binary: 'codium',
        isTerminalEditor: false,
        paths: [
            '/Applications/VSCodium.app/Contents/Resources/app/bin/codium'
        ],
        keywords: []
    },
    {
        id: 'cursor',
        name: 'Cursor',
        binary: 'cursor',
        isTerminalEditor: false,
        paths: [
            '/Applications/Cursor.app/Contents/Resources/app/bin/codium'
        ],
        keywords: []
    },
    {
        id: 'sublime',
        name: 'Sublime Text',
        binary: 'subl',
        isTerminalEditor: false,
        paths: [
            '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
            '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl'
        ],
        keywords: []
    },
    {
        id: 'atom',
        name: 'Atom',
        binary: 'atom',
        isTerminalEditor: false,
        paths: [
            '/Applications/Atom.app/Contents/Resources/app/atom.sh'
        ],
        keywords: []
    },
    {
        id: 'webstorm',
        name: 'WebStorm',
        binary: 'webstorm',
        isTerminalEditor: false,
        paths: [],
        keywords: [
            'wstorm'
        ]
    },
    {
        id: 'phpstorm',
        name: 'PhpStorm',
        binary: 'pstorm',
        isTerminalEditor: false,
        paths: [],
        keywords: [
            'php'
        ]
    },
    {
        id: 'zed',
        name: 'Zed',
        binary: 'zed',
        isTerminalEditor: false,
        paths: [
            '/Applications/Zed.app/Contents/MacOS/cli'
        ],
        keywords: []
    },
    {
        id: 'textmate',
        name: 'TextMate',
        binary: 'mate',
        isTerminalEditor: false,
        paths: [],
        keywords: []
    },
    {
        id: 'intellij',
        name: 'IntelliJ IDEA',
        binary: 'idea',
        isTerminalEditor: false,
        paths: [],
        keywords: [
            'idea',
            'java',
            'jetbrains',
            'ide'
        ]
    },
    {
        id: 'emacsforosx',
        name: 'GNU Emacs for Mac OS X',
        binary: 'Emacs',
        isTerminalEditor: false,
        isOSXOnly: true,
        paths: [
            '/Applications/Emacs.app/Contents/MacOS/Emacs'
        ],
        keywords: []
    },
    {
        id: 'xcode',
        name: 'Xcode',
        binary: 'xed',
        isTerminalEditor: false,
        isOSXOnly: true,
        paths: [
            '/Applications/Xcode.app/Contents/MacOS/Xcode',
            '/Applications/Xcode-beta.app/Contents/MacOS/Xcode'
        ],
        keywords: [
            'xed'
        ]
    },
    {
        id: 'android-studio',
        name: 'Android Studio',
        binary: 'studio',
        isTerminalEditor: false,
        paths: [
            '/Applications/Android Studio.app/Contents/MacOS/studio',
            '/usr/local/Android/android-studio/bin/studio.sh',
            'C:\\Program Files (x86)\\Android\\android-studio\\bin\\studio.exe',
            'C:\\Program Files\\Android\\android-studio\\bin\\studio64.exe'
        ],
        keywords: [
            'studio'
        ]
    }
];
const EDITORS = [
    ...VISUAL_EDITORS,
    ...TERMINAL_EDITORS
];

//# sourceMappingURL=editor.js.map