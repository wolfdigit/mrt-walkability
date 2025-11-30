export interface Coordinates {
  lat: number;
  lng: number;
}

export enum LineColor {
  Red = '#E3002C',
  Blue = '#0070BD',
  Green = '#008659',
  Orange = '#F8B61C',
  Brown = '#C48C31',
  Yellow = '#FFD306',
  LightGreen = '#A3D063' // Wanda Line
}

export interface MRTStation {
  id: string;
  name: string;
  line: string; // Display name of line
  color: LineColor;
  coords: Coordinates;
}

export interface AnalysisResult {
  summary: string;
  highlights: string[];
}