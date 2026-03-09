import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LangKey } from "../i18n";
import type { Theme } from "../theme/themes";
import { THEMES } from "../theme/themes";
import { resolveTheme } from "../utils/settings";

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

export interface Bookmark {
  sura: number;
  aya: number;
  page: number;
  timestamp: number;
  text?: string;
  note?: string;
}

export interface TekrarConfig {
  startSura: number;
  startAya: number;
  endSura: number;
  endAya: number;
  repeatCount: number;
  currentRepeat: number;
  ayahRepeat: number;
  currentAyahRepeat: number;
  active: boolean;
}

export interface KhatmaState {
  unit: "rob3" | "hizb" | "juz";
  startJuz: number;
  startRob3: number;
  rob3Day: number;
  selection: number;
  totalDays: number;
  startDate: number;
  ok: boolean;
  juz?: number;
  day?: number;
  endRob3?: number;
}

export interface RecordingProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface DhikrItem {
  id: string;
  arabic: string;
  target: number;
  isPreset?: boolean;
  ayahRef?: { sura: number; aya: number };
}

const DEFAULT_DHIKR_LIST: DhikrItem[] = [
  { id: "subhanallah", arabic: "سبحان الله", target: 33, isPreset: true },
  { id: "alhamdulillah", arabic: "الحمد لله", target: 33, isPreset: true },
  { id: "allahu_akbar", arabic: "الله أكبر", target: 34, isPreset: true },
  { id: "la_ilaha", arabic: "لا إله إلا الله", target: 100, isPreset: true },
  { id: "astaghfirullah", arabic: "أستغفر الله", target: 100, isPreset: true },
  { id: "la_hawla", arabic: "لا حول ولا قوة إلا بالله", target: 100, isPreset: true },
  { id: "salawat", arabic: "اللهم صل على محمد", target: 100, isPreset: true },
];

interface AppState {
  lang: LangKey;
  quira: Quira;
  theme: Theme;
  moqriId: string;
  lastMadinaRecitorId: string;
  currentPage: number;
  selectedAya: SelectedAya | null;
  isPlaying: boolean;
  hasCompletedSetup: boolean;
  imageDownloadProgress: Record<Quira, ImageDownloadProgress>;
  recordedAyahs: Record<string, boolean>;
  recordingState: RecordingState;
  recordingProfiles: RecordingProfile[];
  activeProfileId: string | null;
  showRecordingHighlights: boolean;
  pendingPlayAya: { sura: number; aya: number; page: number } | null;
  bookmarks: Bookmark[];
  tekrar: TekrarConfig;
  khatma: KhatmaState;
  quranFont: string;
  warshRecitorId: number;
  dhikrList: DhikrItem[];
  vibrateEnabled: boolean;
  mushafMode: "image" | "text";
  textFontSize: number;
  textFontFamily: string; // "auto" | "default" | "Maghribi" | "hafs" | "uthmanic" | "rustam"
  highlightColor: string; // hex color e.g. "#4285F4"
  highlightOpacity: number; // 0.1 – 0.6

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
  setRecordingProfiles: (profiles: RecordingProfile[]) => void;
  setActiveProfileId: (id: string | null) => void;
  setShowRecordingHighlights: (show: boolean) => void;
  setPendingPlayAya: (aya: { sura: number; aya: number; page: number } | null) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (sura: number, aya: number) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  updateBookmarkNote: (sura: number, aya: number, note: string) => void;
  setHasCompletedSetup: (done: boolean) => void;
  setTekrar: (tekrar: TekrarConfig) => void;
  setKhatma: (khatma: KhatmaState) => void;
  setQuranFont: (font: string) => void;
  setWarshRecitorId: (id: number) => void;
  setDhikrList: (list: DhikrItem[]) => void;
  setVibrateEnabled: (enabled: boolean) => void;
  setMushafMode: (mode: "image" | "text") => void;
  setTextFontSize: (size: number) => void;
  setTextFontFamily: (family: string) => void;
  setHighlightColor: (color: string) => void;
  setHighlightOpacity: (opacity: number) => void;
}

const defaultDownloadProgress: ImageDownloadProgress = {
  isDownloading: false,
  downloaded: 0,
  total: 604,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      quira: "warsh",
      theme: THEMES[0],
      moqriId: "__warsh_db_1__",
      lastMadinaRecitorId: "Husary_64kbps",
      currentPage: 1,
      selectedAya: null,
      isPlaying: false,
      hasCompletedSetup: false,

      imageDownloadProgress: {
        madina: { ...defaultDownloadProgress },
        warsh: { ...defaultDownloadProgress },
      },

      recordedAyahs: {},
      recordingState: "idle",
      recordingProfiles: [],
      activeProfileId: null,
      showRecordingHighlights: true,
      pendingPlayAya: null,

      bookmarks: [],
      tekrar: {
        startSura: 1,
        startAya: 1,
        endSura: 1,
        endAya: 7,
        repeatCount: 3,
        currentRepeat: 0,
        ayahRepeat: 1,
        currentAyahRepeat: 0,
        active: false,
      },
      khatma: {
        unit: "hizb",
        startJuz: 1,
        startRob3: 0,
        rob3Day: 4,
        selection: 0,
        totalDays: 60,
        startDate: Date.now(),
        ok: false,
      },
      quranFont: "default",
      warshRecitorId: 1,
      dhikrList: DEFAULT_DHIKR_LIST,
      vibrateEnabled: true,
      mushafMode: "image",
      textFontSize: 22,
      textFontFamily: "auto",
      highlightColor: "#4285F4",
      highlightOpacity: 0.2,

      setLang: (lang) => set({ lang }),
      setQuira: (quira) => {
        set({ quira });
        if (quira === "warsh") {
          const wrid = get().warshRecitorId ?? 1;
          const mid = wrid === 2 ? "__warsh_db_2__" : "__warsh_db_1__";
          set({ moqriId: mid });
        } else {
          const currentMoqri = get().moqriId;
          if (currentMoqri.startsWith("__warsh_db_")) {
            set({ moqriId: get().lastMadinaRecitorId });
          }
        }
      },
      setTheme: (theme) => set({ theme }),
      setMoqriId: (moqriId) => {
        set({ moqriId });
        if (!moqriId.startsWith("__warsh_db_")) {
          set({ lastMadinaRecitorId: moqriId });
        }
      },
      setCurrentPage: (currentPage) => set({ currentPage }),
      setSelectedAya: (selectedAya) => set({ selectedAya }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setImageDownloadProgress: (quira, progress) =>
        set((state) => ({
          imageDownloadProgress: { ...state.imageDownloadProgress, [quira]: progress },
        })),
      setRecordedAyahs: (map) => set({ recordedAyahs: map }),
      markAyahRecorded: (sura, aya) =>
        set((state) => ({
          recordedAyahs: { ...state.recordedAyahs, [`s${sura}a${aya}`]: true },
        })),
      clearRecordedAyahs: () => set({ recordedAyahs: {} }),
      setRecordingState: (recordingState) => set({ recordingState }),
      setRecordingProfiles: (recordingProfiles) => set({ recordingProfiles }),
      setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
      setShowRecordingHighlights: (showRecordingHighlights) => set({ showRecordingHighlights }),
      setPendingPlayAya: (pendingPlayAya) => set({ pendingPlayAya }),
      addBookmark: (bookmark) => {
        const state = get();
        if (state.bookmarks.some((b) => b.sura === bookmark.sura && b.aya === bookmark.aya)) return;
        set({ bookmarks: [bookmark, ...state.bookmarks] });
      },
      removeBookmark: (sura, aya) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => !(b.sura === sura && b.aya === aya)),
        })),
      setBookmarks: (bookmarks) => set({ bookmarks }),
      updateBookmarkNote: (sura, aya, note) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.sura === sura && b.aya === aya ? { ...b, note } : b
          ),
        })),
      setHasCompletedSetup: (hasCompletedSetup) => set({ hasCompletedSetup }),
      setTekrar: (tekrar) => set({ tekrar }),
      setKhatma: (khatma) => set({ khatma }),
      setQuranFont: (quranFont) => set({ quranFont }),
      setDhikrList: (dhikrList) => set({ dhikrList }),
      setVibrateEnabled: (vibrateEnabled) => set({ vibrateEnabled }),
      setMushafMode: (mushafMode) => set({ mushafMode }),
      setTextFontSize: (textFontSize) => set({ textFontSize }),
      setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
      setHighlightColor: (highlightColor) => set({ highlightColor }),
      setHighlightOpacity: (highlightOpacity) => set({ highlightOpacity }),
      setWarshRecitorId: (warshRecitorId) => {
        set({ warshRecitorId });
        if (get().quira === "warsh") {
          set({ moqriId: warshRecitorId === 2 ? "__warsh_db_2__" : "__warsh_db_1__" });
        }
      },
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user-facing state, not session/runtime state
      partialize: (state) => ({
        lang: state.lang,
        quira: state.quira,
        theme: state.theme,
        moqriId: state.moqriId,
        lastMadinaRecitorId: state.lastMadinaRecitorId,
        currentPage: state.currentPage,
        hasCompletedSetup: state.hasCompletedSetup,
        bookmarks: state.bookmarks,
        quranFont: state.quranFont,
        warshRecitorId: state.warshRecitorId,
        dhikrList: state.dhikrList,
        vibrateEnabled: state.vibrateEnabled,
        mushafMode: state.mushafMode,
        textFontSize: state.textFontSize,
        textFontFamily: state.textFontFamily,
        highlightColor: state.highlightColor,
        highlightOpacity: state.highlightOpacity,
      }),
      // After hydration: re-resolve theme from name to pick up any new fields (e.g. borderColor)
      onRehydrateStorage: () => (state) => {
        if (state?.theme?.name) {
          state.theme = resolveTheme(state.theme.name);
        }
      },
    }
  )
);
