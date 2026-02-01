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

export interface ImageDownloadProgress {
  isDownloading: boolean;
  downloaded: number;
  total: number;
}

export type RecordingState = "idle" | "recording" | "saving";

interface AppState {
  lang: LangKey;
  quira: Quira;
  theme: Theme;
  moqriId: string;
  currentPage: number;
  selectedAya: SelectedAya | null;
  isPlaying: boolean;

  // Image download progress per quira
  imageDownloadProgress: Record<Quira, ImageDownloadProgress>;

  // Recording state
  recordedAyahs: Record<string, boolean>; // key: "s{sura}a{aya}"
  recordingState: RecordingState;

  setLang: (lang: LangKey) => void;
  setQuira: (quira: Quira) => void;
  setTheme: (theme: Theme) => void;
  setMoqriId: (id: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedAya: (aya: SelectedAya | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setImageDownloadProgress: (quira: Quira, progress: ImageDownloadProgress) => void;
  setRecordedAyahs: (map: Record<string, boolean>) => void;
  markAyahRecorded: (sura: number, aya: number) => void;
  clearRecordedAyahs: () => void;
  setRecordingState: (state: RecordingState) => void;
}

const defaultDownloadProgress: ImageDownloadProgress = {
  isDownloading: false,
  downloaded: 0,
  total: 604,
};

export const useAppStore = create<AppState>((set) => ({
  lang: "ar",
  quira: "madina",
  theme: THEMES[0],
  moqriId: "Husary_64kbps",
  currentPage: 1,
  selectedAya: null,
  isPlaying: false,

  imageDownloadProgress: {
    madina: { ...defaultDownloadProgress },
    warsh: { ...defaultDownloadProgress },
  },

  recordedAyahs: {},
  recordingState: "idle",

  setLang: (lang) => set({ lang }),
  setQuira: (quira) => set({ quira }),
  setTheme: (theme) => set({ theme }),
  setMoqriId: (moqriId) => set({ moqriId }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSelectedAya: (selectedAya) => set({ selectedAya }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setImageDownloadProgress: (quira, progress) =>
    set((state) => ({
      imageDownloadProgress: {
        ...state.imageDownloadProgress,
        [quira]: progress,
      },
    })),
  setRecordedAyahs: (map) => set({ recordedAyahs: map }),
  markAyahRecorded: (sura, aya) =>
    set((state) => ({
      recordedAyahs: {
        ...state.recordedAyahs,
        [`s${sura}a${aya}`]: true,
      },
    })),
  clearRecordedAyahs: () => set({ recordedAyahs: {} }),
  setRecordingState: (recordingState) => set({ recordingState }),
}));
