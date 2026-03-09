// @ts-ignore
import { ayatJson } from "../data/ayatJson";
import { getWarshIndex } from "./warshAudioDB";
import { textwarsh } from "../data/textWarsh";
import { warshCumulative } from "../data/warshIndex";
import type { Quira } from "../store/useAppStore";

export interface PageAyah {
  sura: number;
  aya: number;
  text: string;
  isFirstInSura: boolean;
}

export interface SuraSection {
  sura: number;
  ayahs: PageAyah[];
}

/** Arabic-Indic numerals for ayah number markers (Hafs only — Warsh has them embedded) */
export function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** ﴿٣﴾ style ayah marker */
export function ayahMarker(n: number): string {
  return `﴿${toArabicNum(n)}﴾`;
}

function annotate(raw: { sura: number; aya: number; text: string }[]): PageAyah[] {
  let prev = -1;
  return raw.map((r) => {
    const isFirstInSura = r.sura !== prev;
    prev = r.sura;
    return { ...r, isFirstInSura };
  });
}

/** Group page ayahs into sura sections */
export function groupBySura(ayahs: PageAyah[]): SuraSection[] {
  const sections: SuraSection[] = [];
  for (const ayah of ayahs) {
    if (ayah.isFirstInSura) {
      sections.push({ sura: ayah.sura, ayahs: [] });
    }
    sections[sections.length - 1].ayahs.push(ayah);
  }
  return sections;
}

/**
 * Get all ayahs for a Hafs (madina) page — synchronous, ayatJson in memory.
 * ayatJson entry: [id, sura, aya, textWithTashkeel, textPlain, page]
 */
export function getHafsPageAyahs(page: number): PageAyah[] {
  const raw = (ayatJson as any[])
    .filter((e) => e[5] === page)
    .map((e) => ({
      sura: Number(e[1]),
      aya: Number(e[2]),
      // ayatJson text doesn't embed the ayah marker — add it
      text: String(e[3]) + " " + ayahMarker(Number(e[2])),
    }));
  return annotate(raw);
}

/**
 * Get all ayahs for a Warsh page — synchronous after initWarshDB.
 * textwarsh entries already embed ﴿n﴾ marker.
 * getWarshIndex() returns [[id, dbPage, sura, aya], ...] (dbPage = appPage+1).
 */
export function getWarshPageAyahs(page: number): PageAyah[] {
  const idx = getWarshIndex() as number[][];
  if (!idx || idx.length === 0) return [];
  const dbPage = page + 1;
  const raw = idx
    .filter((e) => e[1] === dbPage)
    .map((e) => {
      const sura = e[2];
      const aya = e[3];
      const ti = warshCumulative[sura - 1] + (aya - 1);
      const text = textwarsh[ti]?.[0] ?? "";
      return { sura, aya, text };
    });
  return annotate(raw);
}

/** Unified getter */
export function getPageAyahs(page: number, quira: Quira): PageAyah[] {
  return quira === "warsh" ? getWarshPageAyahs(page) : getHafsPageAyahs(page);
}

// Bismillah display constants
export const BISMILLAH_WARSH = "بِسْمِ اِ۬للَّـهِ اِ۬لرَّحْمَـٰنِ اِ۬لرَّحِيمِ";
export const BISMILLAH_HAFS  = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

/** Show bismillah before sura? (not for Fatiha or Tawba) */
export function showBismillah(sura: number): boolean {
  return sura !== 1 && sura !== 9;
}
