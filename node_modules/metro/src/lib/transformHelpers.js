"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.getResolveDependencyFn = getResolveDependencyFn;
exports.getTransformFn = getTransformFn;
var _contextModuleTemplates = require("./contextModuleTemplates");
var _isAssetFile = _interopRequireDefault(
  require("metro-resolver/private/utils/isAssetFile"),
);
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const baseIgnoredInlineRequires = [
  "React",
  "react",
  "react/jsx-dev-runtime",
  "react/jsx-runtime",
  "react-compiler-runtime",
  "react-native",
];
async function calcTransformerOptions(
  entryFiles,
  bundler,
  deltaBundler,
  config,
  options,
  resolverOptions,
) {
  const baseOptions = {
    customTransformOptions: options.customTransformOptions,
    dev: options.dev,
    inlinePlatform: true,
    inlineRequires: false,
    minify: options.minify,
    platform: options.platform,
    unstable_transformProfile: options.unstable_transformProfile,
  };
  if (options.type === "script") {
    return {
      ...baseOptions,
      type: "script",
    };
  }
  const getDependencies = async (path) => {
    const dependencies = await deltaBundler.getDependencies([path], {
      lazy: false,
      onProgress: null,
      resolve: await getResolveDependencyFn(
        bundler,
        options.platform,
        resolverOptions,
      ),
      shallow: false,
      transform: await getTransformFn(
        [path],
        bundler,
        deltaBundler,
        config,
        {
          ...options,
          minify: false,
        },
        resolverOptions,
      ),
      transformOptions: options,
      unstable_allowRequireContext:
        config.transformer.unstable_allowRequireContext,
      unstable_enablePackageExports:
        config.resolver.unstable_enablePackageExports,
      unstable_incrementalResolution:
        config.resolver.unstable_incrementalResolution,
    });
    return Array.from(dependencies.keys());
  };
  const { transform } = await config.transformer.getTransformOptions(
    entryFiles,
    {
      dev: options.dev,
      hot: true,
      platform: options.platform,
    },
    getDependencies,
  );
  return {
    ...baseOptions,
    experimentalImportSupport: transform?.experimentalImportSupport || false,
    inlineRequires: transform?.inlineRequires || false,
    nonInlinedRequires:
      transform?.nonInlinedRequires || baseIgnoredInlineRequires,
    type: "module",
    unstable_memoizeInlineRequires:
      transform?.unstable_memoizeInlineRequires || false,
    unstable_nonMemoizedInlineRequires:
      transform?.unstable_nonMemoizedInlineRequires || [],
  };
}
function removeInlineRequiresBlockListFromOptions(path, inlineRequires) {
  if (typeof inlineRequires === "object") {
    return !(path in inlineRequires.blockList);
  }
  return inlineRequires;
}
async function getTransformFn(
  entryFiles,
  bundler,
  deltaBundler,
  config,
  options,
  resolverOptions,
) {
  const { inlineRequires, ...transformOptions } = await calcTransformerOptions(
    entryFiles,
    bundler,
    deltaBundler,
    config,
    options,
    resolverOptions,
  );
  const assetExts = new Set(config.resolver.assetExts);
  return async (modulePath, requireContext) => {
    let templateBuffer;
    if (requireContext) {
      const graph = await bundler.getDependencyGraph();
      const files = Array.from(
        graph.matchFilesWithContext(requireContext.from, {
          filter: requireContext.filter,
          recursive: requireContext.recursive,
        }),
      );
      const template = (0, _contextModuleTemplates.getContextModuleTemplate)(
        requireContext.mode,
        requireContext.from,
        files,
      );
      templateBuffer = Buffer.from(template);
    }
    return await bundler.transformFile(
      modulePath,
      {
        ...transformOptions,
        inlineRequires: removeInlineRequiresBlockListFromOptions(
          modulePath,
          inlineRequires,
        ),
        type: getType(transformOptions.type, modulePath, assetExts),
      },
      templateBuffer,
    );
  };
}
function getType(type, filePath, assetExts) {
  if (type === "script") {
    return type;
  }
  if ((0, _isAssetFile.default)(filePath, assetExts)) {
    return "asset";
  }
  return "module";
}
async function getResolveDependencyFn(bundler, platform, resolverOptions) {
  const dependencyGraph = await await bundler.getDependencyGraph();
  return (from, dependency) =>
    dependencyGraph.resolveDependency(
      from,
      dependency,
      platform ?? null,
      resolverOptions,
    );
}
