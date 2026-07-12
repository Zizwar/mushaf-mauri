"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = nodeCrawl;
var _RootPathUtils = require("../../lib/RootPathUtils");
var _hasNativeFindSupport = _interopRequireDefault(
  require("./hasNativeFindSupport"),
);
var _child_process = require("child_process");
var fs = _interopRequireWildcard(require("graceful-fs"));
var _os = require("os");
var path = _interopRequireWildcard(require("path"));
function _interopRequireWildcard(e, t) {
  if ("function" == typeof WeakMap)
    var r = new WeakMap(),
      n = new WeakMap();
  return (_interopRequireWildcard = function (e, t) {
    if (!t && e && e.__esModule) return e;
    var o,
      i,
      f = { __proto__: null, default: e };
    if (null === e || ("object" != typeof e && "function" != typeof e))
      return f;
    if ((o = t ? n : r)) {
      if (o.has(e)) return o.get(e);
      o.set(e, f);
    }
    for (const t in e)
      "default" !== t &&
        {}.hasOwnProperty.call(e, t) &&
        ((i =
          (o = Object.defineProperty) &&
          Object.getOwnPropertyDescriptor(e, t)) &&
        (i.get || i.set)
          ? o(f, t, i)
          : (f[t] = e[t]));
    return f;
  })(e, t);
}
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const debug = require("debug")("Metro:NodeCrawler");
function find(
  roots,
  extensions,
  ignore,
  includeSymlinks,
  rootDir,
  console,
  callback,
) {
  const result = new Map();
  let activeCalls = 0;
  const pathUtils = new _RootPathUtils.RootPathUtils(rootDir);
  function search(directory) {
    activeCalls++;
    fs.readdir(
      directory,
      {
        withFileTypes: true,
      },
      (err, entries) => {
        activeCalls--;
        if (err) {
          console.warn(
            `Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`,
          );
        } else {
          entries.forEach((entry) => {
            const file = path.join(directory, entry.name.toString());
            if (ignore(file)) {
              return;
            }
            if (entry.isSymbolicLink() && !includeSymlinks) {
              return;
            }
            if (entry.isDirectory()) {
              search(file);
              return;
            }
            activeCalls++;
            fs.lstat(file, (err, stat) => {
              activeCalls--;
              if (!err && stat) {
                const ext = path.extname(file).substr(1);
                if (stat.isSymbolicLink() || extensions.includes(ext)) {
                  result.set(pathUtils.absoluteToNormal(file), [
                    stat.mtime.getTime(),
                    stat.size,
                    0,
                    null,
                    stat.isSymbolicLink() ? 1 : 0,
                    null,
                  ]);
                }
              }
              if (activeCalls === 0) {
                callback(result);
              }
            });
          });
        }
        if (activeCalls === 0) {
          callback(result);
        }
      },
    );
  }
  if (roots.length > 0) {
    roots.forEach(search);
  } else {
    callback(result);
  }
}
function findNative(
  roots,
  extensions,
  ignore,
  includeSymlinks,
  rootDir,
  console,
  callback,
) {
  const extensionClause = extensions.length
    ? `( ${extensions.map((ext) => `-iname *.${ext}`).join(" -o ")} )`
    : "";
  const expression = `( ( -type f ${extensionClause} ) ${includeSymlinks ? "-o -type l " : ""})`;
  const pathUtils = new _RootPathUtils.RootPathUtils(rootDir);
  const child = (0, _child_process.spawn)(
    "find",
    roots.concat(expression.split(" ")),
  );
  let stdout = "";
  if (child.stdout == null) {
    throw new Error(
      "stdout is null - this should never happen. Please open up an issue at https://github.com/facebook/metro",
    );
  }
  child.stdout.setEncoding("utf-8");
  child.stdout.on("data", (data) => (stdout += data));
  child.stdout.on("close", () => {
    const lines = stdout
      .trim()
      .split("\n")
      .filter((x) => !ignore(x));
    const result = new Map();
    let count = lines.length;
    if (!count) {
      callback(new Map());
    } else {
      lines.forEach((path) => {
        fs.lstat(path, (err, stat) => {
          if (!err && stat) {
            result.set(pathUtils.absoluteToNormal(path), [
              stat.mtime.getTime(),
              stat.size,
              0,
              null,
              stat.isSymbolicLink() ? 1 : 0,
              null,
            ]);
          }
          if (--count === 0) {
            callback(result);
          }
        });
      });
    }
  });
}
async function nodeCrawl(options) {
  const {
    console,
    previousState,
    extensions,
    forceNodeFilesystemAPI,
    ignore,
    rootDir,
    includeSymlinks,
    perfLogger,
    roots,
    abortSignal,
    subpath,
  } = options;
  abortSignal?.throwIfAborted();
  perfLogger?.point("nodeCrawl_start");
  const useNativeFind =
    !forceNodeFilesystemAPI &&
    (0, _os.platform)() !== "win32" &&
    (await (0, _hasNativeFindSupport.default)());
  debug("Using system find: %s", useNativeFind);
  return new Promise((resolve, reject) => {
    const callback = (fileData) => {
      const difference = previousState.fileSystem.getDifference(fileData, {
        subpath,
      });
      perfLogger?.point("nodeCrawl_end");
      try {
        abortSignal?.throwIfAborted();
      } catch (e) {
        reject(e);
      }
      resolve(difference);
    };
    if (useNativeFind) {
      findNative(
        roots,
        extensions,
        ignore,
        includeSymlinks,
        rootDir,
        console,
        callback,
      );
    } else {
      find(
        roots,
        extensions,
        ignore,
        includeSymlinks,
        rootDir,
        console,
        callback,
      );
    }
  });
}
