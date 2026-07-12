import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LangKey } from "../i18n";
import { resolveTheme, type Theme } from "../theme/themes";
import { DEFAULT_RECITER_ID } from "../data/reciters";

export type Riwaya = "warsh" | "hafs";
export type RecordMode = "ayah" | "session";
export type FontFamilyKey = "auto" | "Maghribi" | "hafs" | "uthmanic";

export interface LastPosition {
  sura: number;
  aya: number;
  riwaya: Riwaya;
}

interface AppState {
  // persisted
  lang: LangKey;
  riwaya: Riwaya;
  themeName: string;
  textFontSize: number;
  textFontFamily: FontFamilyKey;
  recordMode: RecordMode;
  compareReciterId: string;
  uploaderName: string;
  serverUrl: string;
  lastPosition: LastPosition | null;
  hasHydrated: boolean;

  // transient
  recitationsDirty: number;

  setLang: (lang: LangKey) => void;
  setRiwaya: (riwaya: Riwaya) => void;
  setThemeName: (name: string) => void;
  setTextFontSize: (size: number) => void;
  setTextFontFamily: (f: FontFamilyKey) => void;
  setRecordMode: (m: RecordMode) => void;
  setCompareReciterId: (id: string) => void;
  setUploaderName: (name: string) => void;
  setServerUrl: (url: string) => void;
  setLastPosition: (p: LastPosition | null) => void;
  bumpRecitationsDirty: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: "ar",
      riwaya: "warsh",
      themeName: "white",
      textFontSize: 26,
      textFontFamily: "auto",
      recordMode: "ayah",
      compareReciterId: DEFAULT_RECITER_ID,
      uploaderName: "",
      serverUrl: "",
      lastPosition: null,
      hasHydrated: false,
      recitationsDirty: 0,

      setLang: (lang) => set({ lang }),
      setRiwaya: (riwaya) => set({ riwaya }),
      setThemeName: (themeName) => set({ themeName }),
      setTextFontSize: (textFontSize) => set({ textFontSize }),
      setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
      setRecordMode: (recordMode) => set({ recordMode }),
      setCompareReciterId: (compareReciterId) => set({ compareReciterId }),
      setUploaderName: (uploaderName) => set({ uploaderName }),
      setServerUrl: (serverUrl) => set({ serverUrl }),
      setLastPosition: (lastPosition) => set({ lastPosition }),
      bumpRecitationsDirty: () =>
        set((s) => ({ recitationsDirty: s.recitationsDirty + 1 })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "malite-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        lang: s.lang,
        riwaya: s.riwaya,
        themeName: s.themeName,
        textFontSize: s.textFontSize,
        textFontFamily: s.textFontFamily,
        recordMode: s.recordMode,
        compareReciterId: s.compareReciterId,
        uploaderName: s.uploaderName,
        serverUrl: s.serverUrl,
        lastPosition: s.lastPosition,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Resolved theme object for the current themeName. */
export function useTheme(): Theme {
  const name = useAppStore((s) => s.themeName);
  return resolveTheme(name);
}

/** Font family to use for Quran text given user setting + riwaya. */
export function resolveQuranFont(
  fontFamily: FontFamilyKey,
  riwaya: Riwaya
): string {
  if (fontFamily === "auto") return riwaya === "warsh" ? "Maghribi" : "hafs";
  return fontFamily;
}
