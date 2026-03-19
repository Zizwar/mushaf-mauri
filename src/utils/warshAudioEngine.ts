/**
 * Warsh Audio Engine (data-only API)
 * Manages verse timing data and position tracking for Warsh audio.
 * Does NOT own an AudioPlayer — the hook-based player in AudioPlayer.tsx
 * drives playback; this module only computes URIs, seek times, and verse positions.
 */
import { getWarshAudioUri } from "./api";
import {
  initWarshDB,
  getAudioFileForPage,
  getVersesForFile,
  getWarshRecitors,
  getMaxTimeEnd,
  apiToSeconds,
  findVerseIndex,
  type VerseTimingData,
} from "./warshAudioDB";

// ==================== STATE ====================

let verses: VerseTimingData[] = [];
let maxTimeEnd = 0;
let totalDuration = 0;
let currentFile = "";
let recitorFolder = "";
let currentVerseIdx = -1;
let onVerseChange: ((v: VerseTimingData) => void) | null = null;
let onFinished: (() => void) | null = null;

// ==================== PUBLIC API ====================

export function isWarshDbRecitor(recitorId: number): boolean {
  return recitorId === 1 || recitorId === 2;
}

export async function initWarshEngine(): Promise<void> {
  await initWarshDB();
}

export async function getRecitorFolder(recitorId: number): Promise<string> {
  if (recitorFolder) return recitorFolder;
  const recitors = await getWarshRecitors();
  const r = recitors.find((rec) => rec.recitorId === recitorId);
  recitorFolder = r?.folder ?? "";
  return recitorFolder;
}

/**
 * Set callbacks for verse tracking and audio completion.
 */
export function setCallbacks(
  onVerse: (v: VerseTimingData) => void,
  onEnd: () => void
): void {
  onVerseChange = onVerse;
  onFinished = onEnd;
}

/**
 * Get playback info for a specific verse.
 * Returns the URI and whether a new file needs to be loaded.
 */
export async function getWarshPlayInfo(
  sura: number,
  aya: number,
  page: number,
  recitorId: number
): Promise<{ uri: string; fileTitle: string; isNewFile: boolean } | null> {
  try {
    await initWarshDB();
    const folder = await getRecitorFolder(recitorId);
    if (!folder) return null;

    const fileTitle = await getAudioFileForPage(recitorId, page);
    if (!fileTitle) return null;

    const isNewFile = fileTitle !== currentFile;

    if (isNewFile) {
      verses = await getVersesForFile(recitorId, fileTitle);
      maxTimeEnd = getMaxTimeEnd(verses);
      currentFile = fileTitle;
      totalDuration = 0; // will be set via setDuration() after audio loads
    }

    const idx = findVerseIndex(verses, sura, aya);
    if (idx >= 0) currentVerseIdx = idx;

    const uri = getWarshAudioUri(folder, fileTitle);
    return { uri, fileTitle, isNewFile };
  } catch (e) {
    console.warn("Warsh getWarshPlayInfo error:", e);
    return null;
  }
}

/**
 * Set total duration (call after the hook player reports duration).
 */
export function setDuration(d: number): void {
  totalDuration = d;
}

/**
 * Compute seek time in seconds for a specific verse.
 */
export function computeSeekTime(sura: number, aya: number): number {
  if (totalDuration <= 0 || verses.length === 0) return 0;
  const idx = findVerseIndex(verses, sura, aya);
  if (idx < 0) return 0;
  return Math.max(0, apiToSeconds(verses[idx].timeStart, maxTimeEnd, totalDuration) - 0.1);
}

/**
 * Update position based on current playback time.
 * Calls onVerseChange when the active verse changes.
 */
export function updatePosition(currentTime: number): void {
  if (totalDuration <= 0 || verses.length === 0) return;

  let found = -1;
  for (let i = 0; i < verses.length; i++) {
    const s = apiToSeconds(verses[i].timeStart, maxTimeEnd, totalDuration);
    const e =
      i + 1 < verses.length
        ? apiToSeconds(verses[i + 1].timeStart, maxTimeEnd, totalDuration)
        : apiToSeconds(verses[i].timeEnd, maxTimeEnd, totalDuration);
    if (currentTime >= s - 0.1 && currentTime < e) {
      found = i;
      break;
    }
  }
  if (found === -1 && verses.length > 0) {
    if (currentTime >= apiToSeconds(verses[verses.length - 1].timeStart, maxTimeEnd, totalDuration)) {
      found = verses.length - 1;
    }
  }

  if (found !== currentVerseIdx && found >= 0) {
    currentVerseIdx = found;
    onVerseChange?.(verses[found]);
  }
}

/**
 * Get info for the next audio file (for auto-advance across file boundaries).
 * Returns null if there's no next file.
 */
export async function getNextFileInfo(
  recitorId: number
): Promise<{ uri: string; fileTitle: string } | null> {
  if (!currentFile || verses.length === 0) return null;

  // Get the last verse in the current file to find the next page
  const lastVerse = verses[verses.length - 1];
  const nextPage = lastVerse.pageNum; // DB page; try next app page
  // Actually, we need to find what file comes after currentFile
  // Look up the page after the last verse's page
  const nextAppPage = lastVerse.pageNum; // DB page = appPage + 1, so next app page = dbPage

  try {
    const folder = await getRecitorFolder(recitorId);
    if (!folder) return null;

    const fileTitle = await getAudioFileForPage(recitorId, nextAppPage);
    if (!fileTitle || fileTitle === currentFile) {
      // Try the next page
      const fileTitle2 = await getAudioFileForPage(recitorId, nextAppPage + 1);
      if (!fileTitle2 || fileTitle2 === currentFile) return null;

      verses = await getVersesForFile(recitorId, fileTitle2);
      maxTimeEnd = getMaxTimeEnd(verses);
      currentFile = fileTitle2;
      totalDuration = 0;
      currentVerseIdx = 0;

      return { uri: getWarshAudioUri(folder, fileTitle2), fileTitle: fileTitle2 };
    }

    verses = await getVersesForFile(recitorId, fileTitle);
    maxTimeEnd = getMaxTimeEnd(verses);
    currentFile = fileTitle;
    totalDuration = 0;
    currentVerseIdx = 0;

    return { uri: getWarshAudioUri(folder, fileTitle), fileTitle };
  } catch (e) {
    console.warn("Warsh getNextFileInfo error:", e);
    return null;
  }
}

/**
 * Get the first verse of the current file (for verse tracking after file load).
 */
export function getFirstVerse(): VerseTimingData | null {
  return verses.length > 0 ? verses[0] : null;
}

/**
 * Notify that audio finished (called by AudioPlayer on didJustFinish).
 */
export function notifyFinished(): void {
  onFinished?.();
}

export function stopWarsh(): void {
  verses = [];
  maxTimeEnd = 0;
  totalDuration = 0;
  currentFile = "";
  currentVerseIdx = -1;
}

/**
 * Reset recitor folder cache (when recitor changes).
 */
export function resetRecitorCache(): void {
  recitorFolder = "";
}

export function getCurrentFile(): string {
  return currentFile;
}

export function getTotalDuration(): number {
  return totalDuration;
}
