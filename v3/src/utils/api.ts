import type { Quira } from "../store/useAppStore";

export const getImagePageUri = (pageId: number, quira: Quira = "madina"): string => {
  switch (quira) {
    case "warsh":
      return `https://mushaf.ma/fahres/page/images/muhammadi/page${pageId + 2}.png`;
    case "madina":
    default:
      return `https://www.mushaf.ma/fahres/page/images/hafsTajweed/page${pageId}.png`;
  }
};

export const getAudioUri = (moqriId: string, sura: number, aya: number): string => {
  const suraStr = String(sura).padStart(3, "0");
  const ayaStr = String(aya).padStart(3, "0");
  return `https://cdn.islamic.network/quran/audio/128/${moqriId}/${suraStr}${ayaStr}.mp3`;
};

// KSU audio source (original)
export const getAudioKsuUri = (moqriId: string, sura: number, aya: number): string => {
  const suraStr = String(sura).padStart(3, "0");
  const ayaStr = String(aya).padStart(3, "0");
  return `http://quran.ksu.edu.sa/ayat/mp3/${moqriId}/${suraStr}${ayaStr}.mp3`;
};
