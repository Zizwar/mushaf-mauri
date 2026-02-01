import { File, Directory, Paths } from "expo-file-system";
import { getImagePageUri } from "./api";
import type { Quira } from "../store/useAppStore";

function getDir(quira: Quira): Directory {
  return new Directory(Paths.document, "mushaf-images", quira);
}

function getLocalFile(pageId: number, quira: Quira): File {
  const padded = String(pageId).padStart(3, "0");
  return new File(getDir(quira), `page${padded}.png`);
}

function ensureDir(quira: Quira): void {
  const dir = getDir(quira);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * Returns a local file URI if cached, otherwise the remote URL.
 */
export function getImageUri(pageId: number, quira: Quira): string {
  const localFile = getLocalFile(pageId, quira);
  if (localFile.exists) {
    return localFile.uri;
  }
  return getImagePageUri(pageId, quira);
}

/**
 * Synchronous check using a pre-built set of cached page numbers.
 */
export function getImageUriSync(
  pageId: number,
  quira: Quira,
  cachedPages: Set<number>
): string {
  if (cachedPages.has(pageId)) {
    return getLocalFile(pageId, quira).uri;
  }
  return getImagePageUri(pageId, quira);
}

export function isPageCached(pageId: number, quira: Quira): boolean {
  return getLocalFile(pageId, quira).exists;
}

export function countDownloadedPages(quira: Quira): number {
  const dir = getDir(quira);
  if (!dir.exists) return 0;
  const items = dir.list();
  return items.filter(
    (item) => item instanceof File && item.uri.endsWith(".png")
  ).length;
}

/**
 * Returns a Set of page numbers that are cached for a given quira.
 */
export function getCachedPageSet(quira: Quira): Set<number> {
  const dir = getDir(quira);
  if (!dir.exists) return new Set();
  const items = dir.list();
  const pages = new Set<number>();
  for (const item of items) {
    if (item instanceof File) {
      const name = item.uri.split("/").pop() ?? "";
      const match = name.match(/^page(\d+)\.png$/);
      if (match) {
        pages.add(parseInt(match[1], 10));
      }
    }
  }
  return pages;
}

let abortController: AbortController | null = null;

/**
 * Download pages in a range. Calls onProgress after each page.
 * Returns the count of newly downloaded pages.
 */
export async function downloadPageRange(
  quira: Quira,
  fromPage: number,
  toPage: number,
  onProgress: (downloaded: number, total: number) => void
): Promise<number> {
  ensureDir(quira);

  abortController = new AbortController();
  const signal = abortController.signal;

  const total = toPage - fromPage + 1;
  let downloaded = 0;

  for (let page = fromPage; page <= toPage; page++) {
    if (signal.aborted) break;

    const localFile = getLocalFile(page, quira);
    if (!localFile.exists) {
      const remoteUri = getImagePageUri(page, quira);
      try {
        await File.downloadFileAsync(remoteUri, localFile, { idempotent: true });
      } catch {
        // skip failed page, continue
      }
    }
    downloaded++;
    onProgress(downloaded, total);
  }

  abortController = null;
  return downloaded;
}

export function abortDownload(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

export function deleteAllCachedImages(quira: Quira): void {
  const dir = getDir(quira);
  if (dir.exists) {
    dir.delete();
  }
}
