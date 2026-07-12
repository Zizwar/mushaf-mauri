"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _hmrJSBundle = _interopRequireDefault(
  require("./DeltaBundler/Serializers/hmrJSBundle"),
);
var _GraphNotFoundError = _interopRequireDefault(
  require("./IncrementalBundler/GraphNotFoundError"),
);
var _RevisionNotFoundError = _interopRequireDefault(
  require("./IncrementalBundler/RevisionNotFoundError"),
);
var _debounceAsyncQueue = _interopRequireDefault(
  require("./lib/debounceAsyncQueue"),
);
var _formatBundlingError = _interopRequireDefault(
  require("./lib/formatBundlingError"),
);
var _getGraphId = _interopRequireDefault(require("./lib/getGraphId"));
var _parseBundleOptionsFromBundleRequestUrl = _interopRequireDefault(
  require("./lib/parseBundleOptionsFromBundleRequestUrl"),
);
var _splitBundleOptions = _interopRequireDefault(
  require("./lib/splitBundleOptions"),
);
var transformHelpers = _interopRequireWildcard(
  require("./lib/transformHelpers"),
);
var _metroCore = require("metro-core");
var _nullthrows = _interopRequireDefault(require("nullthrows"));
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
const debug = require("debug")("Metro:HMR");
const { createActionStartEntry, createActionEndEntry, log } = _metroCore.Logger;
function send(sendFns, message) {
  const strMessage = JSON.stringify(message);
  sendFns.forEach((sendFn) => sendFn(strMessage));
}
class HmrServer {
  constructor(bundler, createModuleId, config) {
    this._config = config;
    this._bundler = bundler;
    this._createModuleId = createModuleId;
    this._clientGroups = new Map();
  }
  onClientConnect = async (requestUrl, sendFn) => {
    return {
      sendFn,
      revisionIds: [],
      optedIntoHMR: false,
    };
  };
  async _registerEntryPoint(client, originalRequestUrl, sendFn) {
    debug("Registering entry point: %s", originalRequestUrl);
    const requestUrl =
      this._config.server.rewriteRequestUrl(originalRequestUrl);
    debug("Rewritten as: %s", requestUrl);
    const { bundleType: _bundleType, ...options } = (0,
    _parseBundleOptionsFromBundleRequestUrl.default)(
      requestUrl,
      new Set(this._config.resolver.platforms),
    );
    const { entryFile, resolverOptions, transformOptions, graphOptions } = (0,
    _splitBundleOptions.default)(options);
    const resolutionFn = await transformHelpers.getResolveDependencyFn(
      this._bundler.getBundler(),
      transformOptions.platform,
      resolverOptions,
    );
    const resolvedEntryFilePath = resolutionFn(
      (this._config.server.unstable_serverRoot ?? this._config.projectRoot) +
        "/.",
      {
        name: entryFile,
        data: {
          key: entryFile,
          asyncType: null,
          isESMImport: false,
          locs: [],
        },
      },
    ).filePath;
    const graphId = (0, _getGraphId.default)(
      resolvedEntryFilePath,
      transformOptions,
      {
        resolverOptions,
        shallow: graphOptions.shallow,
        lazy: graphOptions.lazy,
        unstable_allowRequireContext:
          this._config.transformer.unstable_allowRequireContext,
      },
    );
    const revPromise = this._bundler.getRevisionByGraphId(graphId);
    if (!revPromise) {
      send([sendFn], {
        type: "error",
        body: (0, _formatBundlingError.default)(
          new _GraphNotFoundError.default(graphId),
        ),
      });
      return;
    }
    const { graph, id } = await revPromise;
    client.revisionIds.push(id);
    let clientGroup = this._clientGroups.get(id);
    if (clientGroup != null) {
      clientGroup.clients.add(client);
    } else {
      const clientUrl = new URL(requestUrl);
      clientUrl.protocol = "http";
      const clientQuery = clientUrl.searchParams;
      clientQuery.delete("bundleEntry");
      clientQuery.set("dev", clientQuery.get("dev") || "true");
      clientQuery.set("minify", clientQuery.get("minify") || "false");
      clientQuery.set("modulesOnly", "true");
      clientQuery.set("runModule", clientQuery.get("runModule") || "false");
      clientQuery.set("shallow", "true");
      clientGroup = {
        clients: new Set([client]),
        clientUrl: new URL(clientUrl),
        revisionId: id,
        graphOptions,
        unlisten: () => unlisten(),
      };
      this._clientGroups.set(id, clientGroup);
      let latestChangeEvent = null;
      const debounceCallHandleFileChange = (0, _debounceAsyncQueue.default)(
        async () => {
          await this._handleFileChange(
            (0, _nullthrows.default)(clientGroup),
            {
              isInitialUpdate: false,
            },
            latestChangeEvent,
          );
        },
        50,
      );
      const unlisten = this._bundler
        .getDeltaBundler()
        .listen(graph, async (changeEvent) => {
          latestChangeEvent = changeEvent;
          await debounceCallHandleFileChange();
        });
    }
    await this._handleFileChange(clientGroup, {
      isInitialUpdate: true,
    });
    send([sendFn], {
      type: "bundle-registered",
    });
  }
  onClientMessage = async (client, message, sendFn) => {
    let data;
    try {
      data = JSON.parse(String(message));
    } catch (error) {
      send([sendFn], {
        type: "error",
        body: (0, _formatBundlingError.default)(error),
      });
      return Promise.resolve();
    }
    if (data && data.type) {
      switch (data.type) {
        case "register-entrypoints":
          return Promise.all(
            data.entryPoints.map((entryPoint) =>
              this._registerEntryPoint(client, entryPoint, sendFn),
            ),
          );
        case "log":
          if (this._config.server.forwardClientLogs) {
            this._config.reporter.update({
              type: "client_log",
              level: data.level,
              data: data.data,
              mode: data.mode,
            });
          }
          break;
        case "log-opt-in":
          client.optedIntoHMR = true;
          break;
        case "heartbeat":
          debug("Heartbeat received");
          sendFn(String(message));
          break;
        default:
          break;
      }
    }
    return Promise.resolve();
  };
  onClientError = (client, e) => {
    this._config.reporter.update({
      type: "hmr_client_error",
      error: e,
    });
    this.onClientDisconnect(client);
  };
  onClientDisconnect = (client) => {
    client.revisionIds.forEach((revisionId) => {
      const group = this._clientGroups.get(revisionId);
      if (group != null) {
        if (group.clients.size === 1) {
          this._clientGroups.delete(revisionId);
          group.unlisten();
        } else {
          group.clients.delete(client);
        }
      }
    });
  };
  async _handleFileChange(group, options, changeEvent) {
    const logger = !options.isInitialUpdate ? changeEvent?.logger : null;
    if (logger) {
      logger.point("fileChange_end");
      logger.point("hmrPrepareAndSendMessage_start");
    }
    const optedIntoHMR = [...group.clients].some(
      (client) => client.optedIntoHMR,
    );
    const processingHmrChange = log(
      createActionStartEntry({
        action_name: optedIntoHMR
          ? "Processing HMR change"
          : "Processing HMR change (no client opt-in)",
      }),
    );
    const sendFns = [...group.clients].map((client) => client.sendFn);
    send(sendFns, {
      type: "update-start",
      body: options,
    });
    const message = await this._prepareMessage(group, options, changeEvent);
    send(sendFns, message);
    send(sendFns, {
      type: "update-done",
      body: {
        changeId: changeEvent?.changeId,
      },
    });
    log({
      ...createActionEndEntry(processingHmrChange),
      outdated_modules:
        message.type === "update"
          ? message.body.added.length + message.body.modified.length
          : undefined,
    });
    if (logger) {
      logger.point("hmrPrepareAndSendMessage_end");
      logger.end("SUCCESS");
    }
  }
  async _prepareMessage(group, options, changeEvent) {
    const logger = !options.isInitialUpdate ? changeEvent?.logger : null;
    try {
      const revPromise = this._bundler.getRevision(group.revisionId);
      if (!revPromise) {
        return {
          type: "error",
          body: (0, _formatBundlingError.default)(
            new _RevisionNotFoundError.default(group.revisionId),
          ),
        };
      }
      logger?.point("updateGraph_start");
      const { revision, delta } = await this._bundler.updateGraph(
        await revPromise,
        false,
      );
      logger?.point("updateGraph_end");
      this._clientGroups.delete(group.revisionId);
      group.revisionId = revision.id;
      for (const client of group.clients) {
        client.revisionIds = client.revisionIds.filter(
          (revisionId) => revisionId !== group.revisionId,
        );
        client.revisionIds.push(revision.id);
      }
      this._clientGroups.set(group.revisionId, group);
      logger?.point("serialize_start");
      const hmrUpdate = (0, _hmrJSBundle.default)(delta, revision.graph, {
        clientUrl: new URL(group.clientUrl),
        createModuleId: this._createModuleId,
        includeAsyncPaths: group.graphOptions.lazy,
        projectRoot: this._config.projectRoot,
        serverRoot:
          this._config.server.unstable_serverRoot ?? this._config.projectRoot,
      });
      logger?.point("serialize_end");
      return {
        type: "update",
        body: {
          revisionId: revision.id,
          isInitialUpdate: options.isInitialUpdate,
          ...hmrUpdate,
        },
      };
    } catch (error) {
      const formattedError = (0, _formatBundlingError.default)(error);
      this._config.reporter.update({
        type: "bundling_error",
        error,
      });
      return {
        type: "error",
        body: formattedError,
      };
    }
  }
}
exports.default = HmrServer;
