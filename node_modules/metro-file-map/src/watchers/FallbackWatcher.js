"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _AbstractWatcher = require("./AbstractWatcher");
var common = _interopRequireWildcard(require("./common"));
var _fs = _interopRequireDefault(require("fs"));
var _os = _interopRequireDefault(require("os"));
var _path = _interopRequireDefault(require("path"));
var _walker = _interopRequireDefault(require("walker"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
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
const platform = _os.default.platform();
const fsPromises = _fs.default.promises;
const TOUCH_EVENT = common.TOUCH_EVENT;
const DELETE_EVENT = common.DELETE_EVENT;
const DEBOUNCE_MS = 100;
class FallbackWatcher extends _AbstractWatcher.AbstractWatcher {
  #changeTimers = new Map();
  #dirRegistry = Object.create(null);
  #watched = Object.create(null);
  async startWatching() {
    this.#watchdir(this.root);
    await new Promise((resolve) => {
      recReaddir(
        this.root,
        (dir) => {
          this.#watchdir(dir);
        },
        (filename) => {
          this.#register(filename, "f");
        },
        (symlink) => {
          this.#register(symlink, "l");
        },
        () => {
          resolve();
        },
        this.#checkedEmitError,
        this.ignored,
      );
    });
  }
  #register(filepath, type) {
    const dir = _path.default.dirname(filepath);
    const filename = _path.default.basename(filepath);
    if (this.#dirRegistry[dir] && this.#dirRegistry[dir][filename]) {
      return false;
    }
    const relativePath = _path.default.relative(this.root, filepath);
    if (
      this.doIgnore(relativePath) ||
      (type === "f" &&
        !common.includedByGlob("f", this.globs, this.dot, relativePath))
    ) {
      return false;
    }
    if (!this.#dirRegistry[dir]) {
      this.#dirRegistry[dir] = Object.create(null);
    }
    this.#dirRegistry[dir][filename] = true;
    return true;
  }
  #unregister(filepath) {
    const dir = _path.default.dirname(filepath);
    if (this.#dirRegistry[dir]) {
      const filename = _path.default.basename(filepath);
      delete this.#dirRegistry[dir][filename];
    }
  }
  #unregisterDir(dirpath) {
    const removedFiles = [];
    for (const registeredDir of Object.keys(this.#dirRegistry)) {
      if (
        registeredDir === dirpath ||
        registeredDir.startsWith(dirpath + _path.default.sep)
      ) {
        for (const filename of Object.keys(this.#dirRegistry[registeredDir])) {
          removedFiles.push(_path.default.join(registeredDir, filename));
        }
        delete this.#dirRegistry[registeredDir];
      }
    }
    return removedFiles;
  }
  #registered(fullpath) {
    const dir = _path.default.dirname(fullpath);
    return !!(
      this.#dirRegistry[fullpath] ||
      (this.#dirRegistry[dir] &&
        this.#dirRegistry[dir][_path.default.basename(fullpath)])
    );
  }
  #checkedEmitError = (error) => {
    if (!isIgnorableFileError(error)) {
      this.emitError(error);
    }
  };
  #watchdir = (dir) => {
    if (this.#watched[dir]) {
      return false;
    }
    const watcher = _fs.default.watch(
      dir,
      {
        persistent: true,
      },
      (event, filename) => this.#normalizeChange(dir, event, filename),
    );
    this.#watched[dir] = watcher;
    watcher.on("error", this.#checkedEmitError);
    if (this.root !== dir) {
      this.#register(dir, "d");
    }
    return true;
  };
  async #stopWatching(dir) {
    if (this.#watched[dir]) {
      await new Promise((resolve) => {
        this.#watched[dir].once("close", () => process.nextTick(resolve));
        this.#watched[dir].close();
        delete this.#watched[dir];
      });
    }
  }
  async stopWatching() {
    await super.stopWatching();
    const promises = Object.keys(this.#watched).map((dir) =>
      this.#stopWatching(dir),
    );
    await Promise.all(promises);
  }
  #detectChangedFile(dir, event, callback) {
    if (!this.#dirRegistry[dir]) {
      return;
    }
    let found = false;
    let closest = null;
    let c = 0;
    Object.keys(this.#dirRegistry[dir]).forEach((file, i, arr) => {
      _fs.default.lstat(_path.default.join(dir, file), (error, stat) => {
        if (found) {
          return;
        }
        if (error) {
          if (isIgnorableFileError(error)) {
            found = true;
            callback(file);
          } else {
            this.emitError(error);
          }
        } else {
          if (closest == null || stat.mtime > closest.mtime) {
            closest = {
              file,
              mtime: stat.mtime,
            };
          }
          if (arr.length === ++c) {
            callback(closest.file);
          }
        }
      });
    });
  }
  #normalizeChange(dir, event, file) {
    if (!file) {
      this.#detectChangedFile(dir, event, (actualFile) => {
        if (actualFile) {
          this.#processChange(dir, event, actualFile).catch((error) =>
            this.emitError(error),
          );
        }
      });
    } else {
      this.#processChange(dir, event, _path.default.normalize(file)).catch(
        (error) => this.emitError(error),
      );
    }
  }
  async #processChange(dir, event, file) {
    const fullPath = _path.default.join(dir, file);
    const relativePath = _path.default.join(
      _path.default.relative(this.root, dir),
      file,
    );
    const registered = this.#registered(fullPath);
    try {
      const stat = await fsPromises.lstat(fullPath);
      if (stat.isDirectory()) {
        if (event === "change") {
          return;
        }
        if (
          this.doIgnore(relativePath) ||
          !common.includedByGlob("d", this.globs, this.dot, relativePath)
        ) {
          return;
        }
        recReaddir(
          _path.default.resolve(this.root, relativePath),
          (dir, stats) => {
            if (this.#watchdir(dir)) {
              this.#emitEvent({
                event: TOUCH_EVENT,
                relativePath: _path.default.relative(this.root, dir),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: "d",
                },
              });
            }
          },
          (file, stats) => {
            if (this.#register(file, "f")) {
              this.#emitEvent({
                event: TOUCH_EVENT,
                relativePath: _path.default.relative(this.root, file),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: "f",
                },
              });
            }
          },
          (symlink, stats) => {
            if (this.#register(symlink, "l")) {
              this.emitFileEvent({
                event: TOUCH_EVENT,
                relativePath: _path.default.relative(this.root, symlink),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: "l",
                },
              });
            }
          },
          function endCallback() {},
          this.#checkedEmitError,
          this.ignored,
        );
      } else {
        const type = common.typeFromStat(stat);
        if (type == null) {
          return;
        }
        const metadata = {
          modifiedTime: stat.mtime.getTime(),
          size: stat.size,
          type,
        };
        if (registered) {
          this.#emitEvent({
            event: TOUCH_EVENT,
            relativePath,
            metadata,
          });
        } else {
          if (this.#register(fullPath, type)) {
            this.#emitEvent({
              event: TOUCH_EVENT,
              relativePath,
              metadata,
            });
          }
        }
      }
    } catch (error) {
      if (!isIgnorableFileError(error)) {
        this.emitError(error);
        return;
      }
      this.#unregister(fullPath);
      const removedFiles = this.#unregisterDir(fullPath);
      for (const removedFile of removedFiles) {
        this.#emitEvent({
          event: DELETE_EVENT,
          relativePath: _path.default.relative(this.root, removedFile),
        });
      }
      if (registered) {
        this.#emitEvent({
          event: DELETE_EVENT,
          relativePath,
        });
      }
      await this.#stopWatching(fullPath);
    }
  }
  #emitEvent(change) {
    const { event, relativePath } = change;
    const key = event + "-" + relativePath;
    const existingTimer = this.#changeTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    this.#changeTimers.set(
      key,
      setTimeout(() => {
        this.#changeTimers.delete(key);
        this.emitFileEvent(change);
      }, DEBOUNCE_MS),
    );
  }
  getPauseReason() {
    return null;
  }
}
exports.default = FallbackWatcher;
function isIgnorableFileError(error) {
  return (
    error.code === "ENOENT" || (error.code === "EPERM" && platform === "win32")
  );
}
function recReaddir(
  dir,
  dirCallback,
  fileCallback,
  symlinkCallback,
  endCallback,
  errorCallback,
  ignored,
) {
  const walk = (0, _walker.default)(dir);
  if (ignored) {
    walk.filterDir(
      (currentDir) => !common.posixPathMatchesPattern(ignored, currentDir),
    );
  }
  walk
    .on("dir", normalizeProxy(dirCallback))
    .on("file", normalizeProxy(fileCallback))
    .on("symlink", normalizeProxy(symlinkCallback))
    .on("error", errorCallback)
    .on("end", () => {
      if (platform === "win32") {
        setTimeout(endCallback, 1000);
      } else {
        endCallback();
      }
    });
}
function normalizeProxy(callback) {
  return (filepath, stats) =>
    callback(_path.default.normalize(filepath), stats);
}
