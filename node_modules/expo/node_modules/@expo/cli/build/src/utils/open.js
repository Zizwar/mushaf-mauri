"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "openBrowserAsync", {
    enumerable: true,
    get: function() {
        return openBrowserAsync;
    }
});
function _osascript() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("@expo/osascript"));
    _osascript = function() {
        return data;
    };
    return data;
}
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
        return data;
    };
    return data;
}
function _os() {
    const data = /*#__PURE__*/ _interop_require_default(require("os"));
    _os = function() {
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
/** Splits an inline script into trimmed, non-empty lines for `osascript -e <line>`. */ function applescript(strings, ...values) {
    let raw = strings[0];
    for(let i = 0; i < values.length; i++){
        raw += String(values[i]) + strings[i + 1];
    }
    return raw.split('\n').map((line)=>line.trim()).filter((line)=>line.length > 0);
}
function buildOpenChromiumTabScript(target, matchUrl) {
    const theURL = _osascript().escapeString(target);
    const matchURL = _osascript().escapeString(matchUrl);
    return applescript`
    property targetTab: null
    property targetTabIndex: -1
    property targetWindow: null
    property theProgram: ""

    on run
      set theProgram to my findRunningChromium()
      if theProgram is "" then error "No Chromium browser is running."
      set theURL to "${theURL}"
      set matchURL to "${matchURL}"
      using terms from application "Google Chrome"
        tell application theProgram
          if (count every window) = 0 then
            make new window
          end if
          set found to my lookupTabWithUrl(matchURL)
          if found then
            set targetWindow's active tab index to targetTabIndex
            tell targetTab to reload
            tell targetWindow to activate
            set index of targetWindow to 1
            return
          end if
          set found to my lookupTabWithUrl("chrome://newtab/")
          if found then
            set targetWindow's active tab index to targetTabIndex
            set URL of targetTab to theURL
            tell targetWindow to activate
            return
          end if
          tell window 1
            activate
            make new tab with properties {URL:theURL}
          end tell
        end tell
      end using terms from
    end run

    on findRunningChromium()
      set candidates to {"Google Chrome Canary", "Google Chrome", "Microsoft Edge", "Brave Browser", "Vivaldi", "Chromium"}
      tell application "System Events"
        set runningNames to name of every process
      end tell
      repeat with candidate in candidates
        set candidateName to candidate as string
        if candidateName is in runningNames then return candidateName
      end repeat
      return ""
    end findRunningChromium

    on lookupTabWithUrl(lookupUrl)
      using terms from application "Google Chrome"
        tell application theProgram
          set found to false
          set theTabIndex to -1
          repeat with theWindow in every window
            set theTabIndex to 0
            repeat with theTab in every tab of theWindow
              set theTabIndex to theTabIndex + 1
              if (theTab's URL as string) contains lookupUrl then
                set targetTab to theTab
                set targetTabIndex to theTabIndex
                set targetWindow to theWindow
                set found to true
                exit repeat
              end if
            end repeat
            if found then exit repeat
          end repeat
        end tell
      end using terms from
      return found
    end lookupTabWithUrl
  `;
}
function safeOrigin(target) {
    try {
        return new URL(target).origin;
    } catch  {
        return target;
    }
}
async function tryOpenInChromiumTabAsync(target) {
    const matchUrl = process.env.OPEN_MATCH_HOST_ONLY === 'true' ? safeOrigin(target) : target;
    try {
        await _osascript().spawnAsync(buildOpenChromiumTabScript(target, matchUrl), {
            stdio: 'ignore'
        });
        return true;
    } catch  {
        return false;
    }
}
async function openBrowserAsync(target) {
    var _process_env_BROWSER;
    const browserEnv = (_process_env_BROWSER = process.env.BROWSER) == null ? void 0 : _process_env_BROWSER.trim();
    if ((browserEnv == null ? void 0 : browserEnv.toLowerCase()) === 'none') {
        return false;
    }
    // On macOS, `BROWSER=open` historically meant "use the default handler" rather than
    // "launch an app called open" — treat it as if BROWSER were unset.
    const browserApp = browserEnv && !(process.platform === 'darwin' && browserEnv.toLowerCase() === 'open') ? browserEnv : undefined;
    const browserArgs = process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(' ') : [];
    if (process.platform === 'darwin') {
        const isDefaultOrChrome = !browserApp || browserApp.toLowerCase() === 'google chrome';
        if (isDefaultOrChrome && await tryOpenInChromiumTabAsync(target)) {
            return true;
        }
        const openArgs = [];
        if (browserApp) openArgs.push('-a', browserApp);
        // Per `open(1)`, everything following `--args` is forwarded to the launched app,
        // so the target URL must come after the args block to reach the app alongside them.
        if (browserArgs.length > 0) openArgs.push('--args', ...browserArgs);
        openArgs.push(target);
        await (0, _spawnasync().default)('open', openArgs, {
            stdio: 'ignore'
        });
        return true;
    }
    if (process.platform === 'win32') {
        await spawnWindowsStartAsync(target, browserApp, browserArgs);
        return true;
    }
    // WSL: when the user hasn't overridden BROWSER, route through Windows `cmd.exe` so
    // the URL opens in the user's Windows browser. Falls through to `xdg-open` otherwise.
    if (!browserApp && isWsl()) {
        await (0, _spawnasync().default)('/mnt/c/Windows/System32/cmd.exe', [
            '/c',
            'start',
            '""',
            target
        ], {
            stdio: 'ignore'
        });
        return true;
    }
    const command = browserApp ?? 'xdg-open';
    await (0, _spawnasync().default)(command, [
        ...browserArgs,
        target
    ], {
        stdio: 'ignore'
    });
    return true;
}
async function spawnWindowsStartAsync(target, browserApp, browserArgs) {
    // Windows preserves env var case in Node, but the OS variable is `SystemRoot`.
    const systemRoot = process.env.SYSTEMROOT ?? process.env.SystemRoot ?? 'C:\\Windows';
    const cmd = _path().default.join(systemRoot, 'System32', 'cmd.exe');
    // `start ""` — the empty quoted string is the window title, so the URL isn't
    // interpreted as a title argument.
    const startArgs = [
        '/c',
        'start',
        '""'
    ];
    if (browserApp) startArgs.push(browserApp);
    startArgs.push(target, ...browserArgs);
    await (0, _spawnasync().default)(cmd, startArgs, {
        stdio: 'ignore'
    });
}
function isWsl() {
    if (process.platform !== 'linux') return false;
    if (process.env.WSL_DISTRO_NAME) return true;
    const release = _os().default.release().toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
}

//# sourceMappingURL=open.js.map