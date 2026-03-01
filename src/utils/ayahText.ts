// @ts-ignore
import { ayatJson } from "../data/ayatJson";
import { getWarshAyahText, getWarshSuraText } from "./warshAudioDB";

import type { Quira } from "../store/useAppStore";

/**
 * Get ayah text with diacritics (tashkeel) by sura/aya.
 * Async because Warsh queries SQLite.
 */
export async function getAyahText(
  sura: number,
  aya: number,
  quira: Quira
): Promise<string | null> {
  if (quira === "warsh") {
    return getWarshAyahText(sura, aya);
  }
  return getAyahTextHafs(sura, aya);
}

/**
 * Get Hafs ayah text from ayatJson (sync — in-memory data file).
 * ayatJson format: [id, sura, aya, textWithTashkeel, textWithoutTashkeel, page]
 */
function getAyahTextHafs(sura: number, aya: number): string | null {
  const entry = ayatJson.find(
    (e: any) => e[1] === sura && e[2] === aya
  );
  return entry ? String(entry[3]) : null;
}

/**
 * Get multiple verses for a sura range.
 * Async because Warsh queries SQLite.
 */
export async function getSuraVerses(
  sura: number,
  fromAya: number,
  toAya: number,
  quira: Quira
): Promise<{ aya: number; text: string }[]> {
  if (quira === "warsh") {
    return getWarshSuraText(sura, fromAya, toAya);
  }
  // Hafs: filter from ayatJson
  const results: { aya: number; text: string }[] = [];
  for (const e of ayatJson) {
    const s = e[1] as number;
    const a = e[2] as number;
    if (s === sura && a >= fromAya && a <= toAya) {
      results.push({ aya: a, text: String(e[3]) });
    }
  }
  return results;
}
