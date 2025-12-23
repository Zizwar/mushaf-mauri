// ============================================
// MUSHAF MAURI V2 - CONSTANTS
// ============================================

// Page positioning constants - CRITICAL for verse highlighting
// These may need adjustment based on screen size
export const PAGE_LAYOUT = {
  MARGIN_PAGE: 55,
  MARGIN_PAGE_WIDTH: 5,
  NISBA: 1.471676300578035, // Aspect ratio for page images
  MINIMAL_PAGE_RENDER: 25,
};

// Total pages per Mushaf variant
export const MUSHAF_PAGES = {
  warsh: 638,      // Warsh - Muhammadi
  hafsTajweed: 604, // Hafs with Tajweed
  madina: 604,     // Madina variant
};

// Theme presets
export const THEME_PRESETS = [
  { id: 'dark', backgroundColor: '#1a1a1a', color: '#fff', isDark: true },
  { id: 'light', backgroundColor: '#fff', color: '#000', isDark: false },
  { id: 'sepia', backgroundColor: '#fffcd9', color: '#000', isDark: false },
  { id: 'blue', backgroundColor: '#e8f7fe', color: '#000', isDark: false },
  { id: 'green', backgroundColor: '#e7f7ec', color: '#000', isDark: false },
];

// Supported languages
export const LANGUAGES = {
  ar: { name: 'العربية', code: 'ar', rtl: true },
  en: { name: 'English', code: 'en', rtl: false },
  fr: { name: 'Français', code: 'fr', rtl: false },
  amz: { name: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', code: 'amz', rtl: true },
} as const;

// Mushaf variants
export const QUIRA_TYPES = {
  warsh: { id: 'warsh', name: 'ورش - محمدي', pages: 638 },
  hafsTajweed: { id: 'hafsTajweed', name: 'حفص - تجويد', pages: 604 },
} as const;

// API endpoints (from original project)
export const API_URLS = {
  QURAN_CLOUD: 'https://alquran.cloud/api/',
  KSU: 'http://quran.ksu.edu.sa/',
  EVERY_AYAH: 'http://www.everyayah.com/data/',
};

// Image URLs for remote loading
export const getPageImageUrl = (quira: string, pageNumber: number): string => {
  const baseUrl = 'https://github.com/nicozizi/mushaf_mauri/raw/master/assets/pages/';
  return `${baseUrl}${quira}/page${pageNumber}.png`;
};

// Audio URL for reciters
export const getAudioUrl = (reciter: string, sura: number, aya: number): string => {
  const paddedSura = String(sura).padStart(3, '0');
  const paddedAya = String(aya).padStart(3, '0');
  return `${API_URLS.EVERY_AYAH}${reciter}/${paddedSura}${paddedAya}.mp3`;
};

// Tafsir API URL
export const getTafsirUrl = (author: string, sura: number, aya: number): string => {
  return `${API_URLS.KSU}tafsir/${author}/${sura}/${aya}.json`;
};

// Font sizes
export const FONT_SIZES = {
  small: 14,
  medium: 18,
  large: 22,
  xlarge: 26,
};
