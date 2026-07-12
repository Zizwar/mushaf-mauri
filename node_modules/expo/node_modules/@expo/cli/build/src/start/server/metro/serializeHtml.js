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
    get assetsRequiresSort () {
        return assetsRequiresSort;
    },
    get serializeHtmlWithAssets () {
        return serializeHtmlWithAssets;
    },
    get sortMatchedAssetsByEntryPoints () {
        return sortMatchedAssetsByEntryPoints;
    }
});
function _html() {
    const data = require("@expo/router-server/build/utils/html");
    _html = function() {
        return data;
    };
    return data;
}
const debug = require('debug')('expo:metro:html');
function serializeHtmlWithAssets({ resources, template, devBundleUrl, baseUrl, route, isExporting, hydrate }) {
    if (!resources) {
        return '';
    }
    return htmlFromSerialAssets(resources, {
        isExporting,
        template,
        baseUrl,
        bundleUrl: isExporting ? undefined : devBundleUrl,
        route,
        hydrate
    });
}
/**
 * Combine the path segments of a URL.
 * This filters out empty segments and avoids duplicate slashes when joining.
 * If base url is empty, it will be treated as a root path, adding `/` to the beginning.
 */ function combineUrlPath(baseUrl, ...segments) {
    return [
        baseUrl || '/',
        ...segments
    ].filter(Boolean).map((segment, index)=>{
        const segmentIsBaseUrl = index === 0;
        // Do not remove leading slashes from baseUrl
        return segment.replace(segmentIsBaseUrl ? /\/+$/g : /^\/+|\/+$/g, '');
    }).join('/');
}
function htmlFromSerialAssets(assets, { isExporting, template, baseUrl, bundleUrl, route, hydrate }) {
    // Combine the CSS modules into tags that have hot refresh data attributes.
    const styleString = assets.filter((asset)=>asset.type.startsWith('css')).map(({ type, metadata, filename, source })=>{
        if (type === 'css') {
            if (isExporting) {
                return (0, _html().createInjectedCssAsString)([
                    combineUrlPath(baseUrl, filename)
                ]);
            } else {
                return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
            }
        }
        // External link tags will be passed through as-is.
        return source;
    }).join('');
    let orderedJsAssets = assetsRequiresSort(assets.filter((asset)=>asset.type === 'js'));
    if ((route == null ? void 0 : route.entryPoints) && Array.isArray(route.entryPoints)) {
        const syncAssets = orderedJsAssets.filter((a)=>!a.metadata.isAsync);
        const sortedAsync = sortMatchedAssetsByEntryPoints(orderedJsAssets.filter((a)=>a.metadata.isAsync), route.entryPoints);
        const runtimeAssets = syncAssets.filter((a)=>{
            var _a_metadata_requires;
            return !((_a_metadata_requires = a.metadata.requires) == null ? void 0 : _a_metadata_requires.length);
        });
        const entryAssets = syncAssets.filter((a)=>{
            var _a_metadata_requires;
            return !!((_a_metadata_requires = a.metadata.requires) == null ? void 0 : _a_metadata_requires.length);
        });
        orderedJsAssets = [
            ...runtimeAssets,
            ...sortedAsync,
            ...entryAssets
        ];
    }
    const scripts = bundleUrl ? `<script src="${bundleUrl}" defer></script>` : orderedJsAssets.map(({ filename, metadata })=>{
        // TODO: Mark dependencies of the HTML and include them to prevent waterfalls.
        if (metadata.isAsync) {
            // We have the data required to match async chunks to the route's HTML file.
            if ((route == null ? void 0 : route.entryPoints) && metadata.modulePaths && Array.isArray(route.entryPoints) && Array.isArray(metadata.modulePaths)) {
                // TODO: Handle module IDs like `expo-router/build/views/Unmatched.js`
                const doesAsyncChunkContainRouteEntryPoint = route.entryPoints.some((entryPoint)=>metadata.modulePaths.includes(entryPoint));
                if (!doesAsyncChunkContainRouteEntryPoint) {
                    return '';
                }
                debug('Linking async chunk %s to HTML for route %s', filename, route.contextKey);
            // Pass through to the next condition.
            } else {
                return '';
            }
        // Mark async chunks as defer so they don't block the page load.
        // return `<script src="${combineUrlPath(baseUrl, filename)" defer></script>`;
        }
        return (0, _html().createInjectedScriptsAsString)([
            combineUrlPath(baseUrl, filename)
        ]);
    }).join('');
    if (hydrate) {
        template = template.replace('</head>', `${(0, _html().getHydrationFlagScriptAsString)()}</head>`);
    }
    return template.replace('</head>', `${styleString}</head>`).replace('</body>', `${scripts}\n</body>`);
}
function sortMatchedAssetsByEntryPoints(matchedAssets, entryPoints) {
    const getEntryPointIndex = (modulePaths)=>modulePaths ? entryPoints.findIndex((ep)=>modulePaths.includes(ep)) : -1;
    return matchedAssets.sort((a, b)=>getEntryPointIndex(a.metadata.modulePaths) - getEntryPointIndex(b.metadata.modulePaths));
}
function assetsRequiresSort(assets) {
    const lookup = new Map();
    const visited = new Set();
    const visiting = new Set();
    const result = [];
    assets.forEach((a)=>{
        lookup.set(a.filename, a);
    });
    function visit(name) {
        var _module_metadata_requires;
        if (visited.has(name)) return;
        if (visiting.has(name)) throw new Error(`Circular dependencies in assets are not allowed. Found cycle: ${[
            ...visiting,
            name
        ].join(' -> ')}`);
        visiting.add(name);
        const module = lookup.get(name);
        if (!module) throw new Error(`Asset not found: ${name}`);
        (_module_metadata_requires = module.metadata.requires) == null ? void 0 : _module_metadata_requires.forEach((dependency)=>{
            visit(dependency);
        });
        visiting.delete(name);
        visited.add(name);
        result.push(module);
    }
    assets.forEach((a)=>{
        if (!visited.has(a.filename)) {
            visit(a.filename);
        }
    });
    return result;
}

//# sourceMappingURL=serializeHtml.js.map