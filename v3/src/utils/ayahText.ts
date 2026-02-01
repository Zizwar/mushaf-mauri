// @ts-ignore
import { ayatJson } from "../data/ayatJson";
// @ts-ignore
import { textwarsh } from "../data/textWarsh";
// @ts-ignore
import indexMuhammadi from "../data/indexMuhammadi";

import type { Quira } from "../store/useAppStore";

/**
 * Get ayah text with diacritics (tashkeel) by sura/aya.
 * Returns the text for the specified mushaf type.
 */
export function getAyahText(
  sura: number,
  aya: number,
  quira: Quira
): string | null {
  if (quira === "warsh") {
    return getAyahTextWarsh(sura, aya);
  }
  return getAyahTextHafs(sura, aya);
}

/**
 * Get Hafs ayah text from ayatJson.
 * ayatJson format: [id, sura, aya, textWithTashkeel, textWithoutTashkeel, page]
 */
function getAyahTextHafs(sura: number, aya: number): string | null {
  const entry = ayatJson.find(
    (e: any) => e[1] === sura && e[2] === aya
  );
  return entry ? String(entry[3]) : null;
}

/**
 * Get Warsh ayah text from textWarsh using indexMuhammadi for ID lookup.
 * indexMuhammadi format: [id, page, sura, aya]
 * textwarsh format: [textWithTashkeel, textWithoutTashkeel] indexed by (id - 1)
 */
function getAyahTextWarsh(sura: number, aya: number): string | null {
  const entry = indexMuhammadi.find(
    (e: any) => e[2] === sura && e[3] === aya
  );
  if (!entry) return null;
  const id = entry[0];
  const textEntry = textwarsh[id - 1];
  return textEntry ? textEntry[0] : null;
}
