// ============================================
// TYPE DEFINITIONS
// ============================================

export type QuiraType = 'warsh' | 'hafsTajweed';
export type LanguageCode = 'ar' | 'en' | 'fr' | 'amz';
export type ThemeId = 'dark' | 'light' | 'sepia' | 'blue' | 'green';

export interface Verse {
  id: number;
  sura: number;
  aya: number;
  text: string;
  textSimple: string;
  page: number;
}

export interface Sura {
  id: number;
  nameAr: string;
  nameAmz: string;
  nameEn: string;
  type: 'Meccan' | 'Medinan';
  ayaCount: number;
  startPage: number;
}

export interface VerseCoordinate {
  sura: number;
  aya: number;
  left: number;
  top: number;
}

export interface Bookmark {
  id: string;
  sura: number;
  aya: number;
  page: number;
  date: string;
  note?: string;
}

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  folder: string;
}

export interface TafsirAuthor {
  id: string;
  nameAr: string;
  nameEn: string;
}

// Navigation types
export type RootStackParamList = {
  Drawer: undefined;
  Wino: { page?: number; sura?: number; aya?: number };
  Suras: undefined;
  Tafsir: { sura: number; aya: number };
  Search: undefined;
  Bookmarks: undefined;
  Settings: undefined;
  Khitma: undefined;
  Reciter: undefined;
  Store: undefined;
};

// Page layout variables - ADJUSTABLE per screen
export interface PageLayoutConfig {
  marginPage: number;
  marginPageWidth: number;
  nisba: number;
  // Coordinate scaling factors
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}
