"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _constants = _interopRequireDefault(require("../constants"));
var _RootPathUtils = require("./RootPathUtils");
var _invariant = _interopRequireDefault(require("invariant"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function isDirectory(node) {
  return node instanceof Map;
}
function isRegularFile(node) {
  return node[_constants.default.SYMLINK] === 0;
}
class TreeFS {
  #cachedNormalSymlinkTargets = new WeakMap();
  #pathUtils;
  #processFile;
  #rootDir;
  #rootNode = new Map();
  constructor(opts) {
    const { rootDir, files, processFile } = opts;
    this.#rootDir = rootDir;
    this.#pathUtils = new _RootPathUtils.RootPathUtils(rootDir);
    this.#processFile = processFile;
    if (files != null) {
      this.bulkAddOrModify(files);
    }
  }
  getSerializableSnapshot() {
    return this.#cloneTree(this.#rootNode);
  }
  static fromDeserializedSnapshot(args) {
    const { rootDir, fileSystemData, processFile } = args;
    const tfs = new TreeFS({
      processFile,
      rootDir,
    });
    tfs.#rootNode = fileSystemData;
    return tfs;
  }
  getSize(mixedPath) {
    const fileMetadata = this.#getFileData(mixedPath);
    return (fileMetadata && fileMetadata[_constants.default.SIZE]) ?? null;
  }
  getDifference(files, options) {
    const changedFiles = new Map(files);
    const removedFiles = new Set();
    const subpath = options?.subpath;
    let rootNode = this.#rootNode;
    let prefix = "";
    if (subpath != null && subpath !== "") {
      const lookupResult = this.#lookupByNormalPath(subpath, {
        followLeaf: true,
      });
      if (!lookupResult.exists || !isDirectory(lookupResult.node)) {
        return {
          changedFiles,
          removedFiles,
        };
      }
      rootNode = lookupResult.node;
      prefix = lookupResult.canonicalPath;
    }
    for (const { canonicalPath, metadata } of this.#metadataIterator(
      rootNode,
      {
        includeNodeModules: true,
        includeSymlinks: true,
      },
      prefix,
    )) {
      const newMetadata = files.get(canonicalPath);
      if (newMetadata) {
        if (isRegularFile(newMetadata) !== isRegularFile(metadata)) {
          continue;
        }
        if (
          newMetadata[_constants.default.MTIME] != null &&
          newMetadata[_constants.default.MTIME] != 0 &&
          newMetadata[_constants.default.MTIME] ===
            metadata[_constants.default.MTIME]
        ) {
          changedFiles.delete(canonicalPath);
        } else if (
          newMetadata[_constants.default.SHA1] != null &&
          newMetadata[_constants.default.SHA1] ===
            metadata[_constants.default.SHA1] &&
          metadata[_constants.default.VISITED] === 1
        ) {
          const updatedMetadata = [...metadata];
          updatedMetadata[_constants.default.MTIME] =
            newMetadata[_constants.default.MTIME];
          changedFiles.set(canonicalPath, updatedMetadata);
        }
      } else {
        removedFiles.add(canonicalPath);
      }
    }
    return {
      changedFiles,
      removedFiles,
    };
  }
  getSha1(mixedPath) {
    const fileMetadata = this.#getFileData(mixedPath);
    return (fileMetadata && fileMetadata[_constants.default.SHA1]) ?? null;
  }
  async getOrComputeSha1(mixedPath) {
    const normalPath = this.#normalizePath(mixedPath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: true,
    });
    if (!result.exists || isDirectory(result.node)) {
      return null;
    }
    const { canonicalPath, node: fileMetadata } = result;
    const existing = fileMetadata[_constants.default.SHA1];
    if (existing != null && existing.length > 0) {
      return {
        sha1: existing,
      };
    }
    const maybeContent = await this.#processFile(canonicalPath, fileMetadata, {
      computeSha1: true,
    });
    const sha1 = fileMetadata[_constants.default.SHA1];
    (0, _invariant.default)(
      sha1 != null && sha1.length > 0,
      "File processing didn't populate a SHA-1 hash for %s",
      canonicalPath,
    );
    return maybeContent
      ? {
          content: maybeContent,
          sha1,
        }
      : {
          sha1,
        };
  }
  exists(mixedPath) {
    const result = this.#getFileData(mixedPath);
    return result != null;
  }
  lookup(mixedPath) {
    const normalPath = this.#normalizePath(mixedPath);
    const links = new Set();
    const result = this.#lookupByNormalPath(normalPath, {
      collectLinkPaths: links,
      followLeaf: true,
    });
    if (!result.exists) {
      const { canonicalMissingPath } = result;
      return {
        exists: false,
        links,
        missing: this.#pathUtils.normalToAbsolute(canonicalMissingPath),
      };
    }
    const { canonicalPath, node } = result;
    const realPath = this.#pathUtils.normalToAbsolute(canonicalPath);
    if (isDirectory(node)) {
      return {
        exists: true,
        links,
        realPath,
        type: "d",
      };
    }
    (0, _invariant.default)(
      isRegularFile(node),
      "lookup follows symlinks, so should never return one (%s -> %s)",
      mixedPath,
      canonicalPath,
    );
    return {
      exists: true,
      links,
      realPath,
      type: "f",
      metadata: node,
    };
  }
  getAllFiles() {
    return Array.from(
      this.metadataIterator({
        includeNodeModules: true,
        includeSymlinks: false,
      }),
      ({ canonicalPath }) => this.#pathUtils.normalToAbsolute(canonicalPath),
    );
  }
  linkStats(mixedPath) {
    const fileMetadata = this.#getFileData(mixedPath, {
      followLeaf: false,
    });
    if (fileMetadata == null) {
      return null;
    }
    const fileType = isRegularFile(fileMetadata) ? "f" : "l";
    return {
      fileType,
      modifiedTime: fileMetadata[_constants.default.MTIME],
      size: fileMetadata[_constants.default.SIZE],
    };
  }
  *matchFiles(opts) {
    const {
      filter = null,
      filterCompareAbsolute = false,
      filterComparePosix = false,
      follow = false,
      recursive = true,
      rootDir = null,
    } = opts;
    const normalRoot = rootDir == null ? "" : this.#normalizePath(rootDir);
    const contextRootResult = this.#lookupByNormalPath(normalRoot);
    if (!contextRootResult.exists) {
      return;
    }
    const {
      ancestorOfRootIdx,
      canonicalPath: rootRealPath,
      node: contextRoot,
      parentNode: contextRootParent,
    } = contextRootResult;
    if (!isDirectory(contextRoot)) {
      return;
    }
    const contextRootAbsolutePath =
      rootRealPath === ""
        ? this.#rootDir
        : _path.default.join(this.#rootDir, rootRealPath);
    const prefix = filterComparePosix ? "./" : "." + _path.default.sep;
    const contextRootAbsolutePathForComparison =
      filterComparePosix && _path.default.sep !== "/"
        ? contextRootAbsolutePath.replaceAll(_path.default.sep, "/")
        : contextRootAbsolutePath;
    for (const relativePathForComparison of this.#pathIterator(
      contextRoot,
      contextRootParent,
      ancestorOfRootIdx,
      {
        alwaysYieldPosix: filterComparePosix,
        canonicalPathOfRoot: rootRealPath,
        follow,
        recursive,
        subtreeOnly: rootDir != null,
      },
    )) {
      if (
        filter == null ||
        filter.test(
          filterCompareAbsolute === true
            ? _path.default.join(
                contextRootAbsolutePathForComparison,
                relativePathForComparison,
              )
            : prefix + relativePathForComparison,
        )
      ) {
        const relativePath =
          filterComparePosix === true && _path.default.sep !== "/"
            ? relativePathForComparison.replaceAll("/", _path.default.sep)
            : relativePathForComparison;
        yield _path.default.join(contextRootAbsolutePath, relativePath);
      }
    }
  }
  addOrModify(mixedPath, metadata, changeListener) {
    const normalPath = this.#normalizePath(mixedPath);
    const parentDirNode = this.#lookupByNormalPath(
      _path.default.dirname(normalPath),
      {
        changeListener,
        makeDirectories: true,
      },
    );
    if (!parentDirNode.exists) {
      throw new Error(
        `TreeFS: Failed to make parent directory entry for ${mixedPath}`,
      );
    }
    const canonicalPath = this.#normalizePath(
      parentDirNode.canonicalPath +
        _path.default.sep +
        _path.default.basename(normalPath),
    );
    this.bulkAddOrModify(new Map([[canonicalPath, metadata]]), changeListener);
  }
  bulkAddOrModify(addedOrModifiedFiles, changeListener) {
    let lastDir;
    let directoryNode;
    for (const [normalPath, metadata] of addedOrModifiedFiles) {
      const lastSepIdx = normalPath.lastIndexOf(_path.default.sep);
      const dirname = lastSepIdx === -1 ? "" : normalPath.slice(0, lastSepIdx);
      const basename =
        lastSepIdx === -1 ? normalPath : normalPath.slice(lastSepIdx + 1);
      if (directoryNode == null || dirname !== lastDir) {
        const lookup = this.#lookupByNormalPath(dirname, {
          changeListener,
          followLeaf: false,
          makeDirectories: true,
        });
        if (!lookup.exists) {
          throw new Error(
            `TreeFS: Unexpected error adding ${normalPath}.\nMissing: ` +
              lookup.canonicalMissingPath,
          );
        }
        if (!isDirectory(lookup.node)) {
          throw new Error(
            `TreeFS: Could not add directory ${dirname}, adding ${normalPath}. ` +
              `${dirname} already exists in the file map as a file.`,
          );
        }
        lastDir = dirname;
        directoryNode = lookup.node;
      }
      if (changeListener != null) {
        const existingNode = directoryNode.get(basename);
        if (existingNode != null) {
          (0, _invariant.default)(
            !isDirectory(existingNode),
            "Detected addition or modification of file %s, but it is tracked as a non-empty directory",
            normalPath,
          );
          changeListener.fileModified(normalPath, existingNode, metadata);
        } else {
          changeListener.fileAdded(normalPath, metadata);
        }
      }
      directoryNode.set(basename, metadata);
    }
  }
  remove(mixedPath, changeListener) {
    const normalPath = this.#normalizePath(mixedPath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: false,
    });
    if (!result.exists) {
      return;
    }
    const { parentNode, canonicalPath, node } = result;
    if (isDirectory(node) && node.size > 0) {
      for (const basename of node.keys()) {
        this.remove(
          canonicalPath + _path.default.sep + basename,
          changeListener,
        );
      }
      return;
    }
    if (parentNode != null) {
      if (changeListener != null) {
        if (isDirectory(node)) {
          changeListener.directoryRemoved(canonicalPath);
        } else {
          changeListener.fileRemoved(canonicalPath, node);
        }
      }
      parentNode.delete(_path.default.basename(canonicalPath));
      if (parentNode.size === 0 && parentNode !== this.#rootNode) {
        this.remove(_path.default.dirname(canonicalPath), changeListener);
      }
    }
  }
  #lookupByNormalPath(
    requestedNormalPath,
    opts = {
      followLeaf: true,
      makeDirectories: false,
    },
  ) {
    let targetNormalPath = requestedNormalPath;
    let seen;
    let fromIdx = opts.start?.pathIdx ?? 0;
    let parentNode = opts.start?.node ?? this.#rootNode;
    let ancestorOfRootIdx = opts.start?.ancestorOfRootIdx ?? 0;
    const { collectAncestors, changeListener } = opts;
    let unseenPathFromIdx = 0;
    while (targetNormalPath.length > fromIdx) {
      const nextSepIdx = targetNormalPath.indexOf(_path.default.sep, fromIdx);
      const isLastSegment = nextSepIdx === -1;
      const segmentName = isLastSegment
        ? targetNormalPath.slice(fromIdx)
        : targetNormalPath.slice(fromIdx, nextSepIdx);
      const isUnseen = fromIdx >= unseenPathFromIdx;
      fromIdx = !isLastSegment ? nextSepIdx + 1 : targetNormalPath.length;
      if (segmentName === ".") {
        continue;
      }
      let segmentNode = parentNode.get(segmentName);
      if (segmentName === ".." && ancestorOfRootIdx != null) {
        ancestorOfRootIdx++;
      } else if (segmentNode != null) {
        ancestorOfRootIdx = null;
      }
      if (segmentNode == null) {
        if (opts.makeDirectories !== true && segmentName !== "..") {
          return {
            canonicalMissingPath: isLastSegment
              ? targetNormalPath
              : targetNormalPath.slice(0, fromIdx - 1),
            exists: false,
            missingSegmentName: segmentName,
          };
        }
        segmentNode = new Map();
        if (opts.makeDirectories === true) {
          if (changeListener != null) {
            const canonicalPath = isLastSegment
              ? targetNormalPath
              : targetNormalPath.slice(0, fromIdx - 1);
            changeListener.directoryAdded(canonicalPath);
          }
          parentNode.set(segmentName, segmentNode);
        }
      }
      if (
        (nextSepIdx === targetNormalPath.length - 1 &&
          isDirectory(segmentNode)) ||
        (isLastSegment &&
          (isDirectory(segmentNode) ||
            isRegularFile(segmentNode) ||
            opts.followLeaf === false))
      ) {
        return {
          ancestorOfRootIdx,
          canonicalPath: isLastSegment
            ? targetNormalPath
            : targetNormalPath.slice(0, -1),
          exists: true,
          node: segmentNode,
          parentNode,
        };
      }
      if (isDirectory(segmentNode)) {
        parentNode = segmentNode;
        if (collectAncestors && isUnseen) {
          const currentPath = isLastSegment
            ? targetNormalPath
            : targetNormalPath.slice(0, fromIdx - 1);
          collectAncestors.push({
            ancestorOfRootIdx,
            node: segmentNode,
            normalPath: currentPath,
            segmentName,
          });
        }
      } else {
        const currentPath = isLastSegment
          ? targetNormalPath
          : targetNormalPath.slice(0, fromIdx - 1);
        if (isRegularFile(segmentNode)) {
          return {
            canonicalMissingPath: currentPath,
            exists: false,
            missingSegmentName: segmentName,
          };
        }
        const normalSymlinkTarget = this.#resolveSymlinkTargetToNormalPath(
          segmentNode,
          currentPath,
        );
        if (opts.collectLinkPaths) {
          opts.collectLinkPaths.add(
            this.#pathUtils.normalToAbsolute(currentPath),
          );
        }
        const remainingTargetPath = isLastSegment
          ? ""
          : targetNormalPath.slice(fromIdx);
        const joinedResult = this.#pathUtils.joinNormalToRelative(
          normalSymlinkTarget.normalPath,
          remainingTargetPath,
        );
        targetNormalPath = joinedResult.normalPath;
        if (
          collectAncestors &&
          !isLastSegment &&
          (normalSymlinkTarget.ancestorOfRootIdx === 0 ||
            joinedResult.collapsedSegments > 0)
        ) {
          let node = this.#rootNode;
          let collapsedPath = "";
          const reverseAncestors = [];
          for (
            let i = 0;
            i <= joinedResult.collapsedSegments && isDirectory(node);
            i++
          ) {
            if (
              i > 0 ||
              normalSymlinkTarget.ancestorOfRootIdx === 0 ||
              joinedResult.collapsedSegments > 0
            ) {
              reverseAncestors.push({
                ancestorOfRootIdx: i,
                node,
                normalPath: collapsedPath,
                segmentName: this.#pathUtils.getBasenameOfNthAncestor(i),
              });
            }
            node = node.get("..") ?? new Map();
            collapsedPath =
              collapsedPath === ""
                ? ".."
                : collapsedPath + _path.default.sep + "..";
          }
          collectAncestors.push(...reverseAncestors.reverse());
        }
        unseenPathFromIdx = normalSymlinkTarget.startOfBasenameIdx;
        if (seen == null) {
          seen = new Set([requestedNormalPath]);
        }
        if (seen.has(targetNormalPath)) {
          return {
            canonicalMissingPath: targetNormalPath,
            exists: false,
            missingSegmentName: segmentName,
          };
        }
        seen.add(targetNormalPath);
        fromIdx = 0;
        parentNode = this.#rootNode;
        ancestorOfRootIdx = 0;
      }
    }
    (0, _invariant.default)(
      parentNode === this.#rootNode,
      "Unexpectedly escaped traversal",
    );
    return {
      ancestorOfRootIdx: 0,
      canonicalPath: targetNormalPath,
      exists: true,
      node: this.#rootNode,
      parentNode: null,
    };
  }
  hierarchicalLookup(mixedStartPath, subpath, opts) {
    const ancestorsOfInput = [];
    const normalPath = this.#normalizePath(mixedStartPath);
    const invalidatedBy = opts.invalidatedBy;
    const closestLookup = this.#lookupByNormalPath(normalPath, {
      collectAncestors: ancestorsOfInput,
      collectLinkPaths: invalidatedBy,
    });
    if (closestLookup.exists && isDirectory(closestLookup.node)) {
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        closestLookup.canonicalPath,
        subpath,
        opts.subpathType,
        invalidatedBy,
        null,
      );
      if (maybeAbsolutePathMatch != null) {
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath: "",
        };
      }
    } else {
      if (
        invalidatedBy &&
        (!closestLookup.exists || !isDirectory(closestLookup.node))
      ) {
        invalidatedBy.add(
          this.#pathUtils.normalToAbsolute(
            closestLookup.exists
              ? closestLookup.canonicalPath
              : closestLookup.canonicalMissingPath,
          ),
        );
      }
      if (
        opts.breakOnSegment != null &&
        !closestLookup.exists &&
        closestLookup.missingSegmentName === opts.breakOnSegment
      ) {
        return null;
      }
    }
    let commonRoot = this.#rootNode;
    let commonRootDepth = 0;
    if (closestLookup.exists && closestLookup.ancestorOfRootIdx != null) {
      commonRootDepth = closestLookup.ancestorOfRootIdx;
      (0, _invariant.default)(
        isDirectory(closestLookup.node),
        "ancestors of the root must be directories",
      );
      commonRoot = closestLookup.node;
    } else {
      for (const ancestor of ancestorsOfInput) {
        if (ancestor.ancestorOfRootIdx == null) {
          break;
        }
        commonRootDepth = ancestor.ancestorOfRootIdx;
        commonRoot = ancestor.node;
      }
    }
    for (
      let candidateIdx = ancestorsOfInput.length - 1;
      candidateIdx >= commonRootDepth;
      --candidateIdx
    ) {
      const candidate = ancestorsOfInput[candidateIdx];
      if (candidate.segmentName === opts.breakOnSegment) {
        return null;
      }
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        candidate.normalPath,
        subpath,
        opts.subpathType,
        invalidatedBy,
        {
          ancestorOfRootIdx: candidate.ancestorOfRootIdx,
          node: candidate.node,
          pathIdx:
            candidate.normalPath.length > 0
              ? candidate.normalPath.length + 1
              : 0,
        },
      );
      if (maybeAbsolutePathMatch != null) {
        let prefixLength = commonRootDepth * 3;
        for (let i = commonRootDepth; i <= candidateIdx; i++) {
          prefixLength = normalPath.indexOf(
            _path.default.sep,
            prefixLength + 1,
          );
        }
        const containerRelativePath = normalPath.slice(prefixLength + 1);
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath,
        };
      }
    }
    let candidateNormalPath =
      commonRootDepth > 0 ? normalPath.slice(0, 3 * commonRootDepth - 1) : "";
    const remainingNormalPath = normalPath.slice(commonRootDepth * 3);
    let nextNode = commonRoot;
    let depthBelowCommonRoot = 0;
    while (isDirectory(nextNode)) {
      const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(
        candidateNormalPath,
        subpath,
        opts.subpathType,
        invalidatedBy,
        null,
      );
      if (maybeAbsolutePathMatch != null) {
        const rootDirParts = this.#pathUtils.getParts();
        const relativeParts =
          depthBelowCommonRoot > 0
            ? rootDirParts.slice(
                -(depthBelowCommonRoot + commonRootDepth),
                commonRootDepth > 0 ? -commonRootDepth : undefined,
              )
            : [];
        if (remainingNormalPath !== "") {
          relativeParts.push(remainingNormalPath);
        }
        return {
          absolutePath: maybeAbsolutePathMatch,
          containerRelativePath: relativeParts.join(_path.default.sep),
        };
      }
      depthBelowCommonRoot++;
      candidateNormalPath =
        candidateNormalPath === ""
          ? ".."
          : candidateNormalPath + _path.default.sep + "..";
      nextNode = nextNode.get("..");
    }
    return null;
  }
  #checkCandidateHasSubpath(
    normalCandidatePath,
    subpath,
    subpathType,
    invalidatedBy,
    start,
  ) {
    const lookupResult = this.#lookupByNormalPath(
      this.#pathUtils.joinNormalToRelative(normalCandidatePath, subpath)
        .normalPath,
      {
        collectLinkPaths: invalidatedBy,
      },
    );
    if (
      lookupResult.exists &&
      isDirectory(lookupResult.node) === (subpathType === "d")
    ) {
      return this.#pathUtils.normalToAbsolute(lookupResult.canonicalPath);
    } else if (invalidatedBy) {
      invalidatedBy.add(
        this.#pathUtils.normalToAbsolute(
          lookupResult.exists
            ? lookupResult.canonicalPath
            : lookupResult.canonicalMissingPath,
        ),
      );
    }
    return null;
  }
  *metadataIterator(opts) {
    yield* this.#metadataIterator(this.#rootNode, opts);
  }
  *#metadataIterator(rootNode, opts, prefix = "") {
    for (const [name, node] of rootNode) {
      if (
        !opts.includeNodeModules &&
        isDirectory(node) &&
        name === "node_modules"
      ) {
        continue;
      }
      const prefixedName =
        prefix === "" ? name : prefix + _path.default.sep + name;
      if (isDirectory(node)) {
        yield* this.#metadataIterator(node, opts, prefixedName);
      } else if (isRegularFile(node) || opts.includeSymlinks) {
        yield {
          baseName: name,
          canonicalPath: prefixedName,
          metadata: node,
        };
      }
    }
  }
  #normalizePath(relativeOrAbsolutePath) {
    return _path.default.isAbsolute(relativeOrAbsolutePath)
      ? this.#pathUtils.absoluteToNormal(relativeOrAbsolutePath)
      : this.#pathUtils.relativeToNormal(relativeOrAbsolutePath);
  }
  *#directoryNodeIterator(node, parent, ancestorOfRootIdx) {
    if (ancestorOfRootIdx != null && ancestorOfRootIdx > 0 && parent) {
      yield [
        this.#pathUtils.getBasenameOfNthAncestor(ancestorOfRootIdx - 1),
        parent,
      ];
    }
    yield* node.entries();
  }
  *#pathIterator(
    iterationRootNode,
    iterationRootParentNode,
    ancestorOfRootIdx,
    opts,
    pathPrefix = "",
    followedLinks = new Set(),
  ) {
    const pathSep = opts.alwaysYieldPosix ? "/" : _path.default.sep;
    const prefixWithSep = pathPrefix === "" ? pathPrefix : pathPrefix + pathSep;
    for (const [name, node] of this.#directoryNodeIterator(
      iterationRootNode,
      iterationRootParentNode,
      ancestorOfRootIdx,
    )) {
      if (opts.subtreeOnly && name === "..") {
        continue;
      }
      const nodePath = prefixWithSep + name;
      if (!isDirectory(node)) {
        if (isRegularFile(node)) {
          yield nodePath;
        } else {
          const nodePathWithSystemSeparators =
            pathSep === _path.default.sep
              ? nodePath
              : nodePath.replaceAll(pathSep, _path.default.sep);
          const normalPathOfSymlink = _path.default.join(
            opts.canonicalPathOfRoot,
            nodePathWithSystemSeparators,
          );
          const resolved = this.#lookupByNormalPath(normalPathOfSymlink, {
            followLeaf: true,
          });
          if (!resolved.exists) {
            continue;
          }
          const target = resolved.node;
          if (!isDirectory(target)) {
            yield nodePath;
          } else if (
            opts.recursive &&
            opts.follow &&
            !followedLinks.has(node)
          ) {
            yield* this.#pathIterator(
              target,
              resolved.parentNode,
              resolved.ancestorOfRootIdx,
              opts,
              nodePath,
              new Set([...followedLinks, node]),
            );
          }
        }
      } else if (opts.recursive) {
        yield* this.#pathIterator(
          node,
          iterationRootParentNode,
          ancestorOfRootIdx != null && ancestorOfRootIdx > 0
            ? ancestorOfRootIdx - 1
            : null,
          opts,
          nodePath,
          followedLinks,
        );
      }
    }
  }
  #resolveSymlinkTargetToNormalPath(symlinkNode, canonicalPathOfSymlink) {
    const cachedResult = this.#cachedNormalSymlinkTargets.get(symlinkNode);
    if (cachedResult != null) {
      return cachedResult;
    }
    const literalSymlinkTarget = symlinkNode[_constants.default.SYMLINK];
    (0, _invariant.default)(
      typeof literalSymlinkTarget === "string",
      "Expected symlink target to be populated.",
    );
    const absoluteSymlinkTarget = _path.default.resolve(
      this.#rootDir,
      canonicalPathOfSymlink,
      "..",
      literalSymlinkTarget,
    );
    const normalSymlinkTarget = _path.default.relative(
      this.#rootDir,
      absoluteSymlinkTarget,
    );
    const result = {
      ancestorOfRootIdx:
        this.#pathUtils.getAncestorOfRootIdx(normalSymlinkTarget),
      normalPath: normalSymlinkTarget,
      startOfBasenameIdx:
        normalSymlinkTarget.lastIndexOf(_path.default.sep) + 1,
    };
    this.#cachedNormalSymlinkTargets.set(symlinkNode, result);
    return result;
  }
  #getFileData(
    filePath,
    opts = {
      followLeaf: true,
    },
  ) {
    const normalPath = this.#normalizePath(filePath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: opts.followLeaf,
    });
    if (!result.exists || isDirectory(result.node)) {
      return null;
    }
    return result.node;
  }
  #cloneTree(root) {
    const clone = new Map();
    for (const [name, node] of root) {
      if (isDirectory(node)) {
        clone.set(name, this.#cloneTree(node));
      } else {
        clone.set(name, [...node]);
      }
    }
    return clone;
  }
}
exports.default = TreeFS;
