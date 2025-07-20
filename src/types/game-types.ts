// ============================================================
// CENTRÁLNÍ TYPY PRO HERNÍ APLIKACI
// ============================================================

// Základní typy pro herní mapu
export interface Position {
  x: number;
  y: number;
}

export interface MapDimensions {
  width: number;
  height: number;
}

// Typy terénu
export enum TerrainType {
  PLAINS = 'plains',
  FOREST = 'forest', 
  MOUNTAIN = 'mountain',
  WATER = 'water',
  DESERT = 'desert',
  SWAMP = 'swamp'
}

// Informace o terénu
export interface TerrainInfo {
  type: TerrainType;
  color: string;
  movementCost: number;
  defensiveBonus: number;
  resourceBonus: number;
}

// Herní políčko na mapě
export interface MapTile {
  id: string;
  position: Position;
  terrain: TerrainType;
  ownerId?: string;
  provinceId?: string;
  buildingId?: string;
  unitIds: string[];
  isSpawnZone: boolean;
  lastUpdated: Date;
}

// Informace o hráči
export interface Player {
  id: string;
  name: string;
  email: string;
  allianceId?: string;
  color: string;
  veny: number; // Herní měna
  provinces: string[];
  createdAt: Date;
  lastActive: Date;
}

// Aliace
export interface Alliance {
  id: string;
  name: string;
  color: string;
  leaderId: string;
  memberIds: string[];
  description?: string;
  createdAt: Date;
}

// Država (provincie)
export interface Province {
  id: string;
  name: string;
  ownerId: string;
  allianceId?: string;
  color: string;
  centerPosition: Position;
  tileIds: string[];
  population: number;
  resources: number;
  buildings: string[];
  createdAt: Date;
}

// Budova
export interface Building {
  id: string;
  type: BuildingType;
  name: string;
  position: Position;
  ownerId: string;
  provinceId: string;
  level: number;
  health: number;
  maxHealth: number;
  productionBonus: number;
  createdAt: Date;
}

export enum BuildingType {
  TOWN_HALL = 'town_hall',
  BARRACKS = 'barracks',
  FARM = 'farm',
  MINE = 'mine',
  FORTRESS = 'fortress',
  MARKET = 'market'
}

// Jednotka
export interface Unit {
  id: string;
  type: UnitType;
  name: string;
  position: Position;
  ownerId: string;
  provinceId: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  movement: number;
  maxMovement: number;
  experience: number;
  level: number;
  createdAt: Date;
}

export enum UnitType {
  WARRIOR = 'warrior',
  ARCHER = 'archer',
  CAVALRY = 'cavalry',
  SIEGE = 'siege',
  SCOUT = 'scout'
}

// API Response typy
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameState {
  map: MapTile[][];
  players: Player[];
  alliances: Alliance[];
  provinces: Province[];
  buildings: Building[];
  units: Unit[];
  currentPlayer?: Player;
  gameSettings: GameSettings;
}

export interface GameSettings {
  mapSize: MapDimensions;
  maxPlayers: number;
  startingVeny: number;
  spawnZoneRadius: number;
  allianceColorsEnabled: boolean;
}

// Herní akce
export interface GameAction {
  type: GameActionType;
  playerId: string;
  data: any;
  timestamp: Date;
}

export enum GameActionType {
  MOVE_UNIT = 'move_unit',
  BUILD_STRUCTURE = 'build_structure',
  ATTACK = 'attack',
  CREATE_PROVINCE = 'create_province',
  JOIN_ALLIANCE = 'join_alliance',
  LEAVE_ALLIANCE = 'leave_alliance'
}

// Hook return typy
export interface UseGameDatabaseReturn {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  createProvince: (name: string, position: Position) => Promise<boolean>;
  joinAlliance: (allianceId: string) => Promise<boolean>;
  refreshGameState: () => Promise<void>;
}

// Komponenta props
export interface ProvinceCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onProvinceCreated: (province: Province) => void;
  selectedPosition?: Position;
}

export interface MapGridProps {
  gameState: GameState;
  onTileClick: (position: Position, tile: MapTile) => void;
  selectedPosition?: Position;
}

// Utility typy
export type ColorPalette = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.PLAINS]: '#90EE90',
  [TerrainType.FOREST]: '#228B22', 
  [TerrainType.MOUNTAIN]: '#8B4513',
  [TerrainType.WATER]: '#4169E1',
  [TerrainType.DESERT]: '#F4A460',
  [TerrainType.SWAMP]: '#556B2F'
};

export const ALLIANCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

export const SPAWN_ZONE_RADIUS = 3;
export const DEFAULT_MAP_SIZE: MapDimensions = { width: 30, height: 30 };
export const STARTING_VENY = 1000;