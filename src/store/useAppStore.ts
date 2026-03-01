import { create } from "zustand";
import type { LangKey } from "../i18n";
import type { Theme } from "../theme/themes";
import { THEMES } from "../theme/themes";
import { loadSettings, saveSettings, resolveTheme } from "../utils/settings";

export type Quira = "madina" | "warsh";

// Load persisted settings at module init
const _persisted = loadSettings();

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
  active: boolean;
}

export interface KhatmaState {
  juz: number;
  day: number;
  startRob3: number;
  endRob3: number;
  rob3Day: number;
  selection: number;
  ok: boolean;
}

export interface RecordingProfile {
  id: string;
  name: string;
  createdAt: string;
}

interface AppState {
  lang: LangKey;
  quira: Quira;
  theme: Theme;
  moqriId: string;
  currentPage: number;
  selectedAya: SelectedAya | null;
  isPlaying: boolean;

  // First launch / onboarding
  hasCompletedSetup: boolean;

  // Image download progress per quira
  imageDownloadProgress: Record<Quira, ImageDownloadProgress>;

  // Recording state
  recordedAyahs: Record<string, boolean>; // key: "s{sura}a{aya}"
  recordingState: RecordingState;

  // Recording profiles
  recordingProfiles: RecordingProfile[];
  activeProfileId: string | null;
  showRecordingHighlights: boolean;

  // Pending play request (from action modal etc.)
  pendingPlayAya: { sura: number; aya: number; page: number } | null;

  // Bookmarks
  bookmarks: Bookmark[];

  // Tekrar (repetition for memorization)
  tekrar: TekrarConfig;

  // Khatma (Quran completion tracking)
  khatma: KhatmaState;

  // Font preference for Quran text
  quranFont: string; // "default" | "hafs" | "rustam" | "uthmanic"

  // Warsh-specific audio state
  warshRecitorId: number; // 1=Al-Kouchi, 2=Al-Kazabri

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
}

const defaultDownloadProgress: ImageDownloadProgress = {
  isDownloading: false,
  downloaded: 0,
  total: 604,
};

export const useAppStore = create<AppState>((set, get) => ({
  lang: (_persisted.lang as LangKey) || "ar",
  quira: (_persisted.quira as Quira) || "warsh",
  theme: _persisted.themeName ? resolveTheme(_persisted.themeName) : THEMES[0],
  moqriId: (() => {
    const q = (_persisted.quira as Quira) || "warsh";
    const mid = _persisted.moqriId || "Husary_64kbps";
    if (q === "warsh" && !mid.startsWith("__warsh_db_")) {
      return (_persisted.warshRecitorId || 1) === 2 ? "__warsh_db_2__" : "__warsh_db_1__";
    }
    return mid;
  })(),
  currentPage: _persisted.currentPage || 1,
  selectedAya: null,
  isPlaying: false,
  hasCompletedSetup: _persisted.hasCompletedSetup || false,

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
    active: false,
  },
  khatma: {
    juz: 1,
    day: 30,
    startRob3: 0,
    endRob3: 8,
    rob3Day: 8,
    selection: 0,
    ok: false,
  },

  quranFont: _persisted.quranFont || "default",
  warshRecitorId: _persisted.warshRecitorId || 1,

  setLang: (lang) => { set({ lang }); saveSettings({ lang }); },
  setQuira: (quira) => {
    set({ quira });
    saveSettings({ quira });
    if (quira === "warsh") {
      const wrid = get().warshRecitorId ?? 1;
      const mid = wrid === 2 ? "__warsh_db_2__" : "__warsh_db_1__";
      set({ moqriId: mid });
      saveSettings({ moqriId: mid });
    }
  },
  setTheme: (theme) => { set({ theme }); saveSettings({ themeName: theme.name }); },
  setMoqriId: (moqriId) => { set({ moqriId }); saveSettings({ moqriId }); },
  setCurrentPage: (currentPage) => { set({ currentPage }); saveSettings({ currentPage }); },
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
  setRecordingProfiles: (recordingProfiles) => set({ recordingProfiles }),
  setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
  setShowRecordingHighlights: (showRecordingHighlights) =>
    set({ showRecordingHighlights }),
  setPendingPlayAya: (pendingPlayAya) => set({ pendingPlayAya }),
  addBookmark: (bookmark) =>
    set((state) => {
      const exists = state.bookmarks.some(
        (b) => b.sura === bookmark.sura && b.aya === bookmark.aya
      );
      if (exists) return state;
      return { bookmarks: [bookmark, ...state.bookmarks] };
    }),
  removeBookmark: (sura, aya) =>
    set((state) => ({
      bookmarks: state.bookmarks.filter(
        (b) => !(b.sura === sura && b.aya === aya)
      ),
    })),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  updateBookmarkNote: (sura, aya, note) =>
    set((state) => ({
      bookmarks: state.bookmarks.map((b) =>
        b.sura === sura && b.aya === aya ? { ...b, note } : b
      ),
    })),
  setHasCompletedSetup: (hasCompletedSetup) => { set({ hasCompletedSetup }); saveSettings({ hasCompletedSetup }); },
  setTekrar: (tekrar) => set({ tekrar }),
  setKhatma: (khatma) => set({ khatma }),
  setQuranFont: (quranFont) => { set({ quranFont }); saveSettings({ quranFont }); },
  setWarshRecitorId: (warshRecitorId) => { set({ warshRecitorId }); saveSettings({ warshRecitorId }); },
}));
