// ============================================
// DATA SERVICE LAYER
// Isolated data fetching logic - Easy switch to SQLite later
// ============================================

import { API_URLS } from '../constants';

// Types
export interface Verse {
  id: number;
  sura: number;
  aya: number;
  text: string;          // Full text with tashkeel
  textSimple: string;    // Simplified text
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

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  quality: 'high' | 'medium';
  style: 'murattal' | 'mujawwad' | 'moalim';
}

export interface TafsirAuthor {
  id: string;
  nameAr: string;
  nameEn: string;
}

// ============================================
// DATA SOURCE INTERFACE
// Implement this interface for JSON or SQLite
// ============================================

export interface IDataSource {
  getVerses(): Promise<Verse[]>;
  getVerse(sura: number, aya: number): Promise<Verse | null>;
  getVersesByPage(page: number): Promise<Verse[]>;
  getVersesBySura(sura: number): Promise<Verse[]>;
  getSuras(): Promise<Sura[]>;
  getSura(id: number): Promise<Sura | null>;
  getCoordinates(page: number, quira: string): Promise<VerseCoordinate[]>;
  searchVerses(query: string): Promise<Verse[]>;
}

// ============================================
// JSON DATA SOURCE (Current Implementation)
// ============================================

class JSONDataSource implements IDataSource {
  private verses: Verse[] = [];
  private suras: Sura[] = [];
  private coordinatesWarsh: Map<number, VerseCoordinate[]> = new Map();
  private coordinatesHafs: Map<number, VerseCoordinate[]> = new Map();
  private loaded = false;

  async loadData(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load verses from data file
      const ayatData = require('../data/ayatJson');
      this.verses = ayatData.default.map((v: any[]) => ({
        id: v[0],
        sura: v[1],
        aya: v[2],
        text: v[3],
        textSimple: v[4],
        page: v[5],
      }));

      // Load suras from data file
      const quranData = require('../data/quranData');
      this.suras = quranData.Suras.map((s: any, index: number) => ({
        id: index + 1,
        nameAr: s[0],
        nameAmz: s[1],
        nameEn: s[2],
        type: s[3],
        ayaCount: s[4] || 0,
        startPage: s[5] || 1,
      })).filter((s: any) => s.id > 0);

      // Load coordinates
      const coordWarsh = require('../data/coordinates/coordinateMuhammadi');
      this.loadCoordinates(coordWarsh.default, this.coordinatesWarsh);

      const coordHafs = require('../data/coordinates/coordinateMadina');
      this.loadCoordinates(coordHafs.default, this.coordinatesHafs);

      this.loaded = true;
    } catch (error) {
      console.log('Error loading data:', error);
    }
  }

  private loadCoordinates(data: any[], map: Map<number, VerseCoordinate[]>): void {
    data.forEach((pageCoords, pageIndex) => {
      if (pageCoords && Array.isArray(pageCoords)) {
        map.set(pageIndex, pageCoords.map((c: number[]) => ({
          sura: c[0],
          aya: c[1],
          left: c[2],
          top: c[3],
        })));
      }
    });
  }

  async getVerses(): Promise<Verse[]> {
    await this.loadData();
    return this.verses;
  }

  async getVerse(sura: number, aya: number): Promise<Verse | null> {
    await this.loadData();
    return this.verses.find(v => v.sura === sura && v.aya === aya) || null;
  }

  async getVersesByPage(page: number): Promise<Verse[]> {
    await this.loadData();
    return this.verses.filter(v => v.page === page);
  }

  async getVersesBySura(sura: number): Promise<Verse[]> {
    await this.loadData();
    return this.verses.filter(v => v.sura === sura);
  }

  async getSuras(): Promise<Sura[]> {
    await this.loadData();
    return this.suras;
  }

  async getSura(id: number): Promise<Sura | null> {
    await this.loadData();
    return this.suras.find(s => s.id === id) || null;
  }

  async getCoordinates(page: number, quira: string): Promise<VerseCoordinate[]> {
    await this.loadData();
    const map = quira === 'warsh' ? this.coordinatesWarsh : this.coordinatesHafs;
    return map.get(page) || [];
  }

  async searchVerses(query: string): Promise<Verse[]> {
    await this.loadData();
    const normalizedQuery = query.toLowerCase();
    return this.verses.filter(v =>
      v.textSimple.includes(normalizedQuery) ||
      v.text.includes(normalizedQuery)
    );
  }
}

// ============================================
// FUTURE: SQLite DATA SOURCE
// ============================================

// class SQLiteDataSource implements IDataSource {
//   async getVerses(): Promise<Verse[]> {
//     // Implementation with expo-sqlite
//   }
//   // ... other methods
// }

// ============================================
// DATA SERVICE SINGLETON
// ============================================

class DataService {
  private source: IDataSource;

  constructor() {
    // Currently using JSON, switch to SQLite later
    this.source = new JSONDataSource();
  }

  // Switch data source (for future SQLite migration)
  setDataSource(source: IDataSource): void {
    this.source = source;
  }

  // Proxy methods
  getVerses = () => this.source.getVerses();
  getVerse = (sura: number, aya: number) => this.source.getVerse(sura, aya);
  getVersesByPage = (page: number) => this.source.getVersesByPage(page);
  getVersesBySura = (sura: number) => this.source.getVersesBySura(sura);
  getSuras = () => this.source.getSuras();
  getSura = (id: number) => this.source.getSura(id);
  getCoordinates = (page: number, quira: string) => this.source.getCoordinates(page, quira);
  searchVerses = (query: string) => this.source.searchVerses(query);
}

// Singleton instance
export const dataService = new DataService();
export default dataService;
