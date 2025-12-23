import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// APP STATE STORE (Zustand)
// ============================================

export interface Bookmark {
  id: string;
  sura: number;
  aya: number;
  page: number;
  date: string;
  note?: string;
}

export interface KhitmaProgress {
  currentJuz: number;
  currentPage: number;
  startDate: string;
  daysTarget: number;
}

export interface QuranPosition {
  sura: number;
  aya: number;
  page: number;
}

interface AppState {
  // Current reading position
  position: QuranPosition;
  setPosition: (position: Partial<QuranPosition>) => void;

  // Mushaf variant (warsh | hafsTajweed)
  quira: 'warsh' | 'hafsTajweed';
  setQuira: (quira: 'warsh' | 'hafsTajweed') => void;

  // Bookmarks
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'date'>) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (sura: number, aya: number) => boolean;

  // Reciter
  reciter: string;
  setReciter: (reciter: string) => void;

  // Tafsir author
  tafsirAuthor: string;
  setTafsirAuthor: (author: string) => void;

  // Font size
  fontSize: number;
  setFontSize: (size: number) => void;

  // Player state
  isPlaying: boolean;
  isRepeat: boolean;
  setPlaying: (playing: boolean) => void;
  setRepeat: (repeat: boolean) => void;

  // Khitma progress
  khitma: KhitmaProgress | null;
  setKhitma: (khitma: KhitmaProgress | null) => void;

  // Language (managed separately by i18n, but synced here)
  language: string;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial position - start of Quran
      position: { sura: 1, aya: 1, page: 1 },
      setPosition: (newPosition) =>
        set((state) => ({
          position: { ...state.position, ...newPosition },
        })),

      // Default to Warsh
      quira: 'warsh',
      setQuira: (quira) => set({ quira }),

      // Bookmarks
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              ...bookmark,
              id: `${bookmark.sura}-${bookmark.aya}-${Date.now()}`,
              date: new Date().toISOString(),
            },
          ],
        })),
      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),
      isBookmarked: (sura, aya) =>
        get().bookmarks.some((b) => b.sura === sura && b.aya === aya),

      // Default reciter
      reciter: 'Hudhaify_64kbps',
      setReciter: (reciter) => set({ reciter }),

      // Default tafsir
      tafsirAuthor: 'sa3dy',
      setTafsirAuthor: (tafsirAuthor) => set({ tafsirAuthor }),

      // Font size
      fontSize: 18,
      setFontSize: (fontSize) => set({ fontSize }),

      // Player state
      isPlaying: false,
      isRepeat: false,
      setPlaying: (isPlaying) => set({ isPlaying }),
      setRepeat: (isRepeat) => set({ isRepeat }),

      // Khitma
      khitma: null,
      setKhitma: (khitma) => set({ khitma }),

      // Language
      language: 'ar',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'mushaf-mauri-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAppStore;
