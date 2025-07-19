// src/types/game.ts
export interface Province {
  id: string;
  name: string;
  type: 'own' | 'abandoned' | 'neutral' | 'ally' | 'enemy';
  x: number;
  y: number;
  width: number;
  height: number;
  path?: Path2D;
  
  // Herní data
  army?: ArmyData;
  player?: PlayerData;
  gridX: number;
  gridY: number;
}

export interface ArmyData {
  OFF: number;
  DEFF: number;
  SIEGE: number;
  SPEC: number;
}

export interface PlayerData {
  player: string;
  alliance: string;
}

export interface GameWindow {
  id: string;
  type: 'army-detail' | 'village-overview' | 'alliance' | 'settings';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isResizable: boolean;
  isDraggable: boolean;
  content?: any;
}

export interface AudioPreferences {
  masterVolume: number;
  uiSoundsEnabled: boolean;
  hoverSoundsEnabled: boolean;
  clickSoundsEnabled: boolean;
  militarySoundsEnabled: boolean;
  scrollSoundsEnabled: boolean;
}

export interface GameState {
  selectedProvince: Province | null;
  currentUnitType: number; // 0: OFF, 1: DEFF, 2: SIEGE, 3: SPEC
  mapX: number;
  mapY: number;
  mapScale: number;
  isDragging: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export const UNIT_TYPES = ['OFF', 'DEFF', 'SIEGE', 'SPEC'] as const;
export const UNIT_ICONS = ['⚔️', '🛡️', '🏰', '✨'] as const;
export const UNIT_NAMES = [
  'OFF (Útočné jednotky)',
  'DEFF (Obranné jednotky)', 
  'SIEGE (Obléhací jednotky)',
  'SPEC (Speciální jednotky)'
] as const;

export const GRID_SIZE = 30;
export const CELL_SIZE = 100;
export const PROVINCE_SIZE = 80;