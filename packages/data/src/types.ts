export interface Bilingual {
  es: string;
  en: string;
}

export type BedType = "king" | "twin";

export interface Room {
  n: number;
  beds: [BedType, number][];
  sleeps: number;
}

export interface Distance extends Bilingual {
  km: number;
}

export interface Score extends Bilingual {
  v: number;
}

export interface Comparison extends Bilingual {
  /** true = direct only, "both" = both direct and platform */
  d: true | "both";
}
