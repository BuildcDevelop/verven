// ============================================================
// GENERÁTOR TERÉNU PRO HERNÍ MAPU
// ============================================================

import { TerrainType, Position, MapDimensions } from '../types/game-types';

// ============================================================
// KONFIGURACE GENERÁTORU
// ============================================================

export interface TerrainConfig {
  seed?: number;
  waterLevel: number;        // 0-1, kolik mapy bude voda
  mountainLevel: number;     // 0-1, kolik mapy budou hory
  forestDensity: number;     // 0-1, hustota lesů
  desertSize: number;        // 0-1, velikost pouští
  swampSize: number;         // 0-1, velikost bažin
  smoothingPasses: number;   // počet průchodů vyhlazování
  spawnZoneCount: number;    // počet spawn zón
  spawnZoneRadius: number;   // poloměr spawn zón
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  waterLevel: 0.15,
  mountainLevel: 0.20,
  forestDensity: 0.25,
  desertSize: 0.15,
  swampSize: 0.10,
  smoothingPasses: 3,
  spawnZoneCount: 5,
  spawnZoneRadius: 3
};

// ============================================================
// HERNÍ VLASTNOSTI TERÉNU
// ============================================================

export interface TerrainProperties {
  movementCost: number;      // 1 = normální, 2 = pomalé, 999 = nepřekonatelné
  defensiveBonus: number;    // 0-100% bonus k obraně
  resourceBonus: number;     // 0-100% bonus k produkci zdrojů
  buildable: boolean;        // lze stavět budovy
  navigable: boolean;        // lze projít jednotkami
}

export const TERRAIN_PROPERTIES: Record<TerrainType, TerrainProperties> = {
  [TerrainType.PLAINS]: {
    movementCost: 1,
    defensiveBonus: 0,
    resourceBonus: 10,
    buildable: true,
    navigable: true
  },
  [TerrainType.FOREST]: {
    movementCost: 2,
    defensiveBonus: 25,
    resourceBonus: 5,
    buildable: true,
    navigable: true
  },
  [TerrainType.MOUNTAIN]: {
    movementCost: 3,
    defensiveBonus: 50,
    resourceBonus: 20,
    buildable: false,
    navigable: true
  },
  [TerrainType.WATER]: {
    movementCost: 999,
    defensiveBonus: 0,
    resourceBonus: 0,
    buildable: false,
    navigable: false
  },
  [TerrainType.DESERT]: {
    movementCost: 2,
    defensiveBonus: -10,
    resourceBonus: -5,
    buildable: true,
    navigable: true
  },
  [TerrainType.SWAMP]: {
    movementCost: 3,
    defensiveBonus: 15,
    resourceBonus: -10,
    buildable: false,
    navigable: true
  }
};

// ============================================================
// NOISE GENERÁTOR PRO PROCEDURÁLNÍ TERÉN
// ============================================================

class SimpleNoise {
  private seed: number;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
  }

  // Jednoduchý pseudonáhodný generátor
  private hash(x: number, y: number): number {
    let h = this.seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) / 4294967296 + 0.5;
  }

  // Bilineární interpolace
  private interpolate(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
  }

  // Smooth noise funkce
  private smoothNoise(x: number, y: number): number {
    const corners = (this.hash(x - 1, y - 1) + this.hash(x + 1, y - 1) + 
                    this.hash(x - 1, y + 1) + this.hash(x + 1, y + 1)) / 16;
    const sides = (this.hash(x - 1, y) + this.hash(x + 1, y) + 
                  this.hash(x, y - 1) + this.hash(x, y + 1)) / 8;
    const center = this.hash(x, y) / 4;
    return corners + sides + center;
  }

  // Interpolovaný noise
  public noise(x: number, y: number): number {
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    const fracX = x - intX;
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY);
    const v2 = this.smoothNoise(intX + 1, intY);
    const v3 = this.smoothNoise(intX, intY + 1);
    const v4 = this.smoothNoise(intX + 1, intY + 1);

    const i1 = this.interpolate(v1, v2, fracX);
    const i2 = this.interpolate(v3, v4, fracX);

    return this.interpolate(i1, i2, fracY);
  }

  // Fraktální noise (více oktáv)
  public fractalNoise(x: number, y: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return Math.min(Math.max(value, 0), 1);
  }
}

// ============================================================
// HLAVNÍ TŘÍDA GENERÁTORU TERÉNU
// ============================================================

export class TerrainGenerator {
  private config: TerrainConfig;
  private noise: SimpleNoise;
  private dimensions: MapDimensions;

  constructor(dimensions: MapDimensions, config: TerrainConfig = DEFAULT_TERRAIN_CONFIG) {
    this.dimensions = dimensions;
    this.config = { ...DEFAULT_TERRAIN_CONFIG, ...config };
    this.noise = new SimpleNoise(config.seed);
  }

  // ============================================================
  // GENEROVÁNÍ ZÁKLADNÍHO TERÉNU
  // ============================================================

  generateTerrain(): TerrainType[][] {
    const terrain: TerrainType[][] = [];

    // Inicializace prázdné mapy
    for (let y = 0; y < this.dimensions.height; y++) {
      terrain[y] = [];
      for (let x = 0; x < this.dimensions.width; x++) {
        terrain[y][x] = TerrainType.PLAINS;
      }
    }

    // Generování základních vrstev terénu
    this.generateWater(terrain);
    this.generateMountains(terrain);
    this.generateForests(terrain);
    this.generateDeserts(terrain);
    this.generateSwamps(terrain);

    // Vyhlazování terénu
    for (let i = 0; i < this.config.smoothingPasses; i++) {
      this.smoothTerrain(terrain);
    }

    return terrain;
  }

  // ============================================================
  // GENEROVÁNÍ VODY
  // ============================================================

  private generateWater(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noiseValue = this.noise.fractalNoise(x * 0.05, y * 0.05, 3);
        
        if (noiseValue < this.config.waterLevel) {
          terrain[y][x] = TerrainType.WATER;
        }
      }
    }
  }

  // ============================================================
  // GENEROVÁNÍ HOR
  // ============================================================

  private generateMountains(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] === TerrainType.WATER) continue;
        
        const noiseValue = this.noise.fractalNoise(x * 0.03, y * 0.03, 4);
        
        if (noiseValue > (1 - this.config.mountainLevel)) {
          terrain[y][x] = TerrainType.MOUNTAIN;
        }
      }
    }
  }

  // ============================================================
  // GENEROVÁNÍ LESŮ
  // ============================================================

  private generateForests(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] !== TerrainType.PLAINS) continue;
        
        const noiseValue = this.noise.fractalNoise(x * 0.08, y * 0.08, 2);
        
        if (noiseValue > (1 - this.config.forestDensity)) {
          terrain[y][x] = TerrainType.FOREST;
        }
      }
    }
  }

  // ============================================================
  // GENEROVÁNÍ POUŠTÍ
  // ============================================================

  private generateDeserts(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    
    // Pouště se generují v konkrétních oblastech
    const desertCenters = [
      { x: Math.floor(width * 0.2), y: Math.floor(height * 0.8) },
      { x: Math.floor(width * 0.8), y: Math.floor(height * 0.2) }
    ];

    desertCenters.forEach(center => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (terrain[y][x] !== TerrainType.PLAINS) continue;
          
          const distance = Math.sqrt(
            Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
          );
          
          const maxRadius = Math.min(width, height) * this.config.desertSize;
          const noiseValue = this.noise.noise(x * 0.1, y * 0.1);
          
          if (distance < maxRadius * noiseValue) {
            terrain[y][x] = TerrainType.DESERT;
          }
        }
      }
    });
  }

  // ============================================================
  // GENEROVÁNÍ BAŽIN
  // ============================================================

  private generateSwamps(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] !== TerrainType.PLAINS) continue;
        
        // Bažiny se generují blízko vody
        const nearWater = this.isNearTerrain(terrain, x, y, TerrainType.WATER, 2);
        
        if (nearWater) {
          const noiseValue = this.noise.noise(x * 0.15, y * 0.15);
          
          if (noiseValue > (1 - this.config.swampSize)) {
            terrain[y][x] = TerrainType.SWAMP;
          }
        }
      }
    }
  }

  // ============================================================
  // VYHLAZOVÁNÍ TERÉNU
  // ============================================================

  private smoothTerrain(terrain: TerrainType[][]): void {
    const { width, height } = this.dimensions;
    const newTerrain: TerrainType[][] = JSON.parse(JSON.stringify(terrain));

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = this.getNeighbors(terrain, x, y);
        const terrainCounts = this.countTerrainTypes(neighbors);
        
        // Pokud je políčko obklíčeno jiným terénem, změň ho
        const currentTerrain = terrain[y][x];
        const dominantTerrain = this.getDominantTerrain(terrainCounts);
        
        if (dominantTerrain !== currentTerrain && terrainCounts[dominantTerrain] >= 5) {
          // Některé terény se nemění tak snadno
          if (currentTerrain !== TerrainType.WATER && currentTerrain !== TerrainType.MOUNTAIN) {
            newTerrain[y][x] = dominantTerrain;
          }
        }
      }
    }

    // Kopírování zpět
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        terrain[y][x] = newTerrain[y][x];
      }
    }
  }

  // ============================================================
  // GENEROVÁNÍ SPAWN ZÓN
  // ============================================================

  generateSpawnZones(terrain: TerrainType[][]): Position[] {
    const { width, height } = this.dimensions;
    const spawnZones: Position[] = [];
    
    // Předem definované pozice pro spawn zóny
    const potentialSpawns = [
      { x: Math.floor(width * 0.1), y: Math.floor(height * 0.1) },
      { x: Math.floor(width * 0.9), y: Math.floor(height * 0.1) },
      { x: Math.floor(width * 0.1), y: Math.floor(height * 0.9) },
      { x: Math.floor(width * 0.9), y: Math.floor(height * 0.9) },
      { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5) }
    ];

    // Vybírání nejlepších pozic pro spawn zóny
    for (let i = 0; i < Math.min(this.config.spawnZoneCount, potentialSpawns.length); i++) {
      const spawn = potentialSpawns[i];
      
      // Ověř, že je pozice vhodná pro spawn
      if (this.isValidSpawnLocation(terrain, spawn)) {
        spawnZones.push(spawn);
        
        // Upravit terén kolem spawn zóny aby byl přívětivý
        this.improveSpawnArea(terrain, spawn);
      }
    }

    return spawnZones;
  }

  // ============================================================
  // HELPER FUNKCE
  // ============================================================

  private isNearTerrain(
    terrain: TerrainType[][], 
    x: number, 
    y: number, 
    targetTerrain: TerrainType, 
    radius: number
  ): boolean {
    const { width, height } = this.dimensions;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (terrain[ny][nx] === targetTerrain) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private getNeighbors(terrain: TerrainType[][], x: number, y: number): TerrainType[] {
    const neighbors: TerrainType[] = [];
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < this.dimensions.width && 
            ny >= 0 && ny < this.dimensions.height) {
          neighbors.push(terrain[ny][nx]);
        }
      }
    }
    
    return neighbors;
  }

  private countTerrainTypes(terrains: TerrainType[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    terrains.forEach(terrain => {
      counts[terrain] = (counts[terrain] || 0) + 1;
    });
    
    return counts;
  }

  private getDominantTerrain(counts: Record<string, number>): TerrainType {
    let maxCount = 0;
    let dominant = TerrainType.PLAINS;
    
    Object.entries(counts).forEach(([terrain, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = terrain as TerrainType;
      }
    });
    
    return dominant;
  }

  private isValidSpawnLocation(terrain: TerrainType[][], position: Position): boolean {
    const { x, y } = position;
    const radius = this.config.spawnZoneRadius;
    
    // Spočítej kolik políček kolem je vhodných pro stavbu
    let buildableCount = 0;
    let totalCount = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < this.dimensions.width && 
            ny >= 0 && ny < this.dimensions.height) {
          
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            totalCount++;
            
            const terrainType = terrain[ny][nx];
            if (TERRAIN_PROPERTIES[terrainType].buildable) {
              buildableCount++;
            }
          }
        }
      }
    }
    
    // Alespoň 70% políček musí být vhodných pro stavbu
    return (buildableCount / totalCount) >= 0.7;
  }

  private improveSpawnArea(terrain: TerrainType[][], center: Position): void {
    const radius = this.config.spawnZoneRadius;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = center.x + dx;
        const y = center.y + dy;
        
        if (x >= 0 && x < this.dimensions.width && 
            y >= 0 && y < this.dimensions.height) {
          
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            // Preferuj plains v spawn zónách
            if (terrain[y][x] === TerrainType.SWAMP || 
                terrain[y][x] === TerrainType.DESERT) {
              if (Math.random() > 0.3) {
                terrain[y][x] = TerrainType.PLAINS;
              }
            }
          }
        }
      }
    }
  }

  // ============================================================
  // EXPORTNÍ FUNKCE
  // ============================================================

  static generateCompleteMap(
    dimensions: MapDimensions, 
    config?: Partial<TerrainConfig>
  ): { terrain: TerrainType[][], spawnZones: Position[] } {
    const generator = new TerrainGenerator(dimensions, config);
    const terrain = generator.generateTerrain();
    const spawnZones = generator.generateSpawnZones(terrain);
    
    return { terrain, spawnZones };
  }
}