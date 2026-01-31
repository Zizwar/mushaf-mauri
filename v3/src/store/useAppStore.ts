import { create } from "zustand";
import type { LangKey } from "../i18n";
import type { Theme } from "../theme/themes";
import { THEMES } from "../theme/themes";

export type Quira = "madina" | "warsh";

interface SelectedAya {
  sura: number;
  aya: number;
  page: number;
  id: string;
}

interface AppState {
  lang: LangKey;
  quira: Quira;
  theme: Theme;
  moqriId: string;
  currentPage: number;
  selectedAya: SelectedAya | null;
  isPlaying: boolean;

  setLang: (lang: LangKey) => void;
  setQuira: (quira: Quira) => void;
  setTheme: (theme: Theme) => void;
  setMoqriId: (id: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedAya: (aya: SelectedAya | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: "ar",
  quira: "madina",
  theme: THEMES[0],
  moqriId: "Husary_64kbps",
  currentPage: 604,
  selectedAya: null,
  isPlaying: false,

  setLang: (lang) => set({ lang }),
  setQuira: (quira) => set({ quira }),
  setTheme: (theme) => set({ theme }),
  setMoqriId: (moqriId) => set({ moqriId }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSelectedAya: (selectedAya) => set({ selectedAya }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));
