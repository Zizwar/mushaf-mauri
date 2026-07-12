/**
 * Per-ayah mp3 stream URL for a famous reciter (KSU source, Hafs numbering).
 * Used by the "compare with reciter" feature.
 */
export function getReciterAyahUri(
  reciterId: string,
  sura: number,
  aya: number
): string {
  const s = String(sura).padStart(3, "0");
  const a = String(aya).padStart(3, "0");
  return `https://quran.ksu.edu.sa/ayat/mp3/${reciterId}/${s}${a}.mp3`;
}
