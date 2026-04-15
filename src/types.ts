export interface Program {
  name: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface WeatherData {
  temp: string;
  humidity: string;
}

export type AppMode = 'LOADING' | 'VIDEO' | 'AUDIO' | 'OFF_AIR';
