"use strict";

const { createHash } = require("crypto");
const fs = require("graceful-fs");
function sha1hex(content) {
  return createHash("sha1").update(content).digest("hex");
}
class Worker {
  #plugins;
  constructor({ plugins = [] }) {
    this.#plugins = plugins.map(({ modulePath, setupArgs }) => {
      const PluginWorker = require(modulePath);
      return new PluginWorker(setupArgs);
    });
  }
  processFile(data) {
    let content;
    let sha1;
    const { computeSha1, filePath, pluginsToRun } = data;
    const getContent = () => {
      if (content == null) {
        content = fs.readFileSync(filePath);
      }
      return content;
    };
    const workerUtils = {
      getContent,
    };
    const pluginData = pluginsToRun.map((pluginIdx) =>
      this.#plugins[pluginIdx].processFile(data, workerUtils),
    );
    if (computeSha1) {
      sha1 = sha1hex(getContent());
    }
    return content && data.maybeReturnContent
      ? {
          content,
          pluginData,
          sha1,
        }
      : {
          pluginData,
          sha1,
        };
  }
}
let singletonWorker;
function setup(args) {
  if (singletonWorker) {
    throw new Error("metro-file-map: setup() should only be called once");
  }
  singletonWorker = new Worker(args);
}
function processFile(data) {
  if (!singletonWorker) {
    throw new Error(
      "metro-file-map: setup() must be called before processFile()",
    );
  }
  return singletonWorker.processFile(data);
}
module.exports = {
  setup,
  processFile,
  Worker,
};
