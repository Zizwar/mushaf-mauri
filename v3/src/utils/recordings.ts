import { File, Directory, Paths } from "expo-file-system";
import type { Quira } from "../store/useAppStore";

function getDir(quira: Quira): Directory {
  return new Directory(Paths.document, "recordings", quira);
}

function buildKey(sura: number, aya: number): string {
  const s = String(sura).padStart(3, "0");
  const a = String(aya).padStart(3, "0");
  return `s${s}a${a}`;
}

function getFile(sura: number, aya: number, quira: Quira): File {
  return new File(getDir(quira), `${buildKey(sura, aya)}.m4a`);
}

function ensureDir(quira: Quira): void {
  const dir = getDir(quira);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * Save a recording from a temporary URI to the recordings directory.
 */
export function saveRecording(
  tempUri: string,
  sura: number,
  aya: number,
  quira: Quira
): string {
  ensureDir(quira);
  const dest = getFile(sura, aya, quira);
  if (dest.exists) {
    dest.delete();
  }
  const tempFile = new File(tempUri);
  tempFile.move(dest);
  return dest.uri;
}

/**
 * Returns the local file URI for a recording, or null if not recorded.
 */
export function getRecordingUri(
  sura: number,
  aya: number,
  quira: Quira
): string | null {
  const file = getFile(sura, aya, quira);
  return file.exists ? file.uri : null;
}

/**
 * Synchronous version: check if key is in provided set.
 */
export function hasRecording(
  sura: number,
  aya: number,
  recordedAyahs: Record<string, boolean>
): boolean {
  return !!recordedAyahs[`s${sura}a${aya}`];
}

/**
 * List all recordings for a quira. Returns [{sura, aya, uri}].
 */
export function listRecordings(
  quira: Quira
): { sura: number; aya: number; uri: string }[] {
  const dir = getDir(quira);
  if (!dir.exists) return [];

  const items = dir.list();
  const result: { sura: number; aya: number; uri: string }[] = [];

  for (const item of items) {
    if (item instanceof File) {
      const name = item.uri.split("/").pop() ?? "";
      const match = name.match(/^s(\d+)a(\d+)\.m4a$/);
      if (match) {
        result.push({
          sura: parseInt(match[1], 10),
          aya: parseInt(match[2], 10),
          uri: item.uri,
        });
      }
    }
  }

  return result;
}

/**
 * Delete a single recording.
 */
export function deleteRecording(
  sura: number,
  aya: number,
  quira: Quira
): void {
  const file = getFile(sura, aya, quira);
  if (file.exists) {
    file.delete();
  }
}

/**
 * Delete all recordings for a quira.
 */
export function deleteAllRecordings(quira: Quira): void {
  const dir = getDir(quira);
  if (dir.exists) {
    dir.delete();
  }
}

/**
 * Build a map of recorded ayah keys from the filesystem.
 */
export function buildRecordedAyahSet(
  quira: Quira
): Record<string, boolean> {
  const recordings = listRecordings(quira);
  const map: Record<string, boolean> = {};
  for (const r of recordings) {
    map[`s${r.sura}a${r.aya}`] = true;
  }
  return map;
}
