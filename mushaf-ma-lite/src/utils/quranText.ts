import { textwarsh } from "../data/textWarsh";
import { warshSurahCounts, warshCumulative } from "../data/warshIndex";
import { ayatJson } from "../data/ayatJson";
import { QuranData } from "../data/quranData";
import { frenchSuraNames } from "../data/frenchSuraNames";
import type { LangKey } from "../i18n";
import type { Riwaya } from "../store/useAppStore";

// Hafs per-sura ayah counts (index = sura number, [0] unused)
export const HAFS_AYAH_COUNTS: number[] = [
  0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54,
  45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62,
  55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28,
  20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

export const BISMILLAH_HAFS = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toArabicNum(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)] ?? d)
    .join("");
}

/** ﴿٣﴾ style marker */
export function ayahMarker(n: number): string {
  return `﴿${toArabicNum(n)}﴾`;
}

// Hafs index: ayatJson entries are ordered by sura then aya; build a cumulative
// offset table once so lookups are O(1).
const hafsCumulative: number[] = (() => {
  const cum: number[] = [0];
  for (let s = 1; s <= 114; s++) {
    cum.push(cum[s - 1] + HAFS_AYAH_COUNTS[s]);
  }
  return cum;
})();

export function getAyahCount(sura: number, riwaya: Riwaya): number {
  if (sura < 1 || sura > 114) return 0;
  return riwaya === "warsh"
    ? warshSurahCounts[sura - 1]
    : HAFS_AYAH_COUNTS[sura];
}

/**
 * Full ayah text (with tashkeel) for display, marker included.
 * Warsh: bismillah is embedded in aya 1 by the source text.
 * Hafs: marker is appended here so both riwayat render identically.
 */
export function getAyahText(sura: number, aya: number, riwaya: Riwaya): string {
  if (sura < 1 || sura > 114 || aya < 1) return "";
  if (riwaya === "warsh") {
    if (aya > warshSurahCounts[sura - 1]) return "";
    const entry = textwarsh[warshCumulative[sura - 1] + (aya - 1)];
    return entry ? entry[0] : "";
  }
  if (aya > HAFS_AYAH_COUNTS[sura]) return "";
  const entry = ayatJson[hafsCumulative[sura - 1] + (aya - 1)];
  if (!entry) return "";
  return `${entry[3]} ${ayahMarker(aya)}`;
}

export interface SuraVerse {
  aya: number;
  text: string;
}

export function getSuraVerses(
  sura: number,
  riwaya: Riwaya,
  fromAya = 1,
  toAya = 999
): SuraVerse[] {
  const count = getAyahCount(sura, riwaya);
  const out: SuraVerse[] = [];
  for (let a = Math.max(1, fromAya); a <= Math.min(count, toAya); a++) {
    out.push({ aya: a, text: getAyahText(sura, a, riwaya) });
  }
  return out;
}

/** Show a separate bismillah line before the sura text? */
export function showBismillah(sura: number, riwaya: Riwaya): boolean {
  if (riwaya === "warsh") return false; // embedded in aya 1
  return sura !== 1 && sura !== 9;
}

export function getSuraName(sura: number, lang: LangKey): string {
  const entry = QuranData.Sura[sura];
  if (!entry) return String(sura);
  if (lang === "ar") return entry[0] as string;
  if (lang === "fr") return frenchSuraNames[sura] || (entry[2] as string);
  return entry[2] as string;
}

export function getSuraNameArabic(sura: number): string {
  const entry = QuranData.Sura[sura];
  return entry ? (entry[0] as string) : String(sura);
}

export interface SuraInfo {
  sura: number;
  nameAr: string;
  nameLocalized: string;
  ayahCount: number;
  revelation: string; // "Meccan" | "Medinan"
}

export function allSuwar(lang: LangKey, riwaya: Riwaya): SuraInfo[] {
  const out: SuraInfo[] = [];
  for (let s = 1; s <= 114; s++) {
    const entry = QuranData.Sura[s];
    out.push({
      sura: s,
      nameAr: entry[0] as string,
      nameLocalized: getSuraName(s, lang),
      ayahCount: getAyahCount(s, riwaya),
      revelation: (entry[3] as string) ?? "",
    });
  }
  return out;
}

/** "البقرة ١-٥" / "Al-Baqara 1-5" style range label */
export function rangeLabel(
  sura: number,
  ayaFrom: number,
  ayaTo: number,
  lang: LangKey
): string {
  const name = getSuraName(sura, lang);
  const from = lang === "ar" ? toArabicNum(ayaFrom) : String(ayaFrom);
  const to = lang === "ar" ? toArabicNum(ayaTo) : String(ayaTo);
  return ayaFrom === ayaTo ? `${name} · ${from}` : `${name} · ${from}-${to}`;
}
