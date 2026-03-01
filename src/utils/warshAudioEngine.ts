/**
 * Warsh Audio Engine
 * Manages playback of long Warsh audio files with quadratic timing.
 * Used by AudioPlayer when in Warsh mode with DB reciters (Al-Kouchi, Al-Kazabri).
 */
import { AudioModule } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
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
  type WarshRecitor,
} from "./warshAudioDB";

// ==================== STATE ====================

let warshPlayer: AudioPlayer | null = null;
let verses: VerseTimingData[] = [];
let maxTimeEnd = 0;
let totalDuration = 0;
let currentFile = "";
let recitorFolder = "";
let currentVerseIdx = -1;
let posTimer: ReturnType<typeof setInterval> | null = null;
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
 * Play a specific verse in Warsh mode.
 * Loads the correct audio file if needed, seeks to the verse position.
 */
export async function playWarshVerse(
  sura: number,
  aya: number,
  page: number,
  recitorId: number
): Promise<boolean> {
  try {
    await initWarshDB();
    const folder = await getRecitorFolder(recitorId);
    if (!folder) return false;

    const fileTitle = await getAudioFileForPage(recitorId, page);
    if (!fileTitle) return false;

    const needNewFile = fileTitle !== currentFile;

    if (needNewFile) {
      stopPosTimer();
      disposePlayer();

      // Load verses for this file
      verses = await getVersesForFile(recitorId, fileTitle);
      maxTimeEnd = getMaxTimeEnd(verses);
      currentFile = fileTitle;

      // Create player
      const audioUrl = getWarshAudioUri(folder, fileTitle);
      warshPlayer = new AudioModule.AudioPlayer(audioUrl, 100, false, 0);

      // Wait for duration to be available
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 8000);
        warshPlayer!.addListener("playbackStatusUpdate", (status: any) => {
          if (status.didJustFinish) {
            stopPosTimer();
            onFinished?.();
          }
          if (warshPlayer!.duration > 0 && !warshPlayer!.isBuffering) {
            clearTimeout(timeout);
            totalDuration = warshPlayer!.duration;
            resolve();
          }
        });
        warshPlayer!.play();
      });
    }

    // Seek to the verse
    const idx = findVerseIndex(verses, sura, aya);
    if (idx >= 0 && warshPlayer) {
      currentVerseIdx = idx;
      const seekTime = apiToSeconds(
        verses[idx].timeStart,
        maxTimeEnd,
        totalDuration
      );
      await warshPlayer.seekTo(Math.max(0, seekTime - 0.1));
    }

    if (warshPlayer && !warshPlayer.playing) {
      warshPlayer.play();
    }

    startPosTimer();
    return true;
  } catch (e) {
    console.warn("Warsh audio error:", e);
    return false;
  }
}

export function pauseWarsh(): void {
  warshPlayer?.pause();
  stopPosTimer();
}

export function resumeWarsh(): void {
  warshPlayer?.play();
  startPosTimer();
}

export function stopWarsh(): void {
  stopPosTimer();
  disposePlayer();
  verses = [];
  maxTimeEnd = 0;
  totalDuration = 0;
  currentFile = "";
  currentVerseIdx = -1;
}

export function isWarshPlaying(): boolean {
  return warshPlayer?.playing ?? false;
}

export function isWarshLoaded(): boolean {
  return warshPlayer !== null && currentFile !== "";
}

export function getWarshProgress(): number {
  if (!warshPlayer || totalDuration <= 0) return 0;
  return warshPlayer.currentTime / totalDuration;
}

export function getWarshCurrentTime(): number {
  return warshPlayer?.currentTime ?? 0;
}

export function getWarshDuration(): number {
  return totalDuration;
}

export async function seekWarsh(fraction: number): Promise<void> {
  if (!warshPlayer || totalDuration <= 0) return;
  await warshPlayer.seekTo(fraction * totalDuration);
}

/**
 * Reset recitor folder cache (when recitor changes).
 */
export function resetRecitorCache(): void {
  recitorFolder = "";
}

// ==================== INTERNAL ====================

function disposePlayer(): void {
  if (warshPlayer) {
    try {
      warshPlayer.pause();
      warshPlayer.remove();
    } catch {}
    warshPlayer = null;
  }
}

function startPosTimer(): void {
  stopPosTimer();
  posTimer = setInterval(() => {
    if (!warshPlayer || !warshPlayer.playing) return;

    const pos = warshPlayer.currentTime;
    if (totalDuration <= 0 || verses.length === 0) return;

    let found = -1;
    for (let i = 0; i < verses.length; i++) {
      const s = apiToSeconds(verses[i].timeStart, maxTimeEnd, totalDuration);
      const e =
        i + 1 < verses.length
          ? apiToSeconds(verses[i + 1].timeStart, maxTimeEnd, totalDuration)
          : apiToSeconds(verses[i].timeEnd, maxTimeEnd, totalDuration);
      if (pos >= s - 0.1 && pos < e) {
        found = i;
        break;
      }
    }
    if (found === -1 && verses.length > 0) {
      if (pos >= apiToSeconds(verses[verses.length - 1].timeStart, maxTimeEnd, totalDuration)) {
        found = verses.length - 1;
      }
    }

    if (found !== currentVerseIdx && found >= 0) {
      currentVerseIdx = found;
      onVerseChange?.(verses[found]);
    }
  }, 60);
}

function stopPosTimer(): void {
  if (posTimer) {
    clearInterval(posTimer);
    posTimer = null;
  }
}
