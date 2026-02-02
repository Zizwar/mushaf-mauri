export interface AyahPosition {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  wino: {
    sura: number;
    aya: number;
    page: number;
    id: string;
  };
}

export interface PageData {
  id: number;
}

export interface Reciter {
  id: string;
  voice: string;
}
