// convex/mapGenerator.ts - Přenos logiky z Admin Panelu
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Terrain types a utility funkce (zkopírované z Admin Panelu)
export const TERRAIN_TYPES = {
  PLAINS: 'plains' as const,
  FOREST: 'forest' as const, 
  MOUNTAIN: 'mountain' as const,
  RIVER: 'river' as const,
  LAKE: 'lake' as const,
};

export class ConvexMapGenerator {
  private seed: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, seed?: number) {
    this.width = width;
    this.height = height;
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }

  // Přenesená logika z original MapGenerator
  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private getNoiseValue(x: number, y: number, scale: number): number {
    const nx = x / scale;
    const ny = y / scale;
    
    // Simplified Perlin noise
    const intX = Math.floor(nx);
    const intY = Math.floor(ny);
    const fracX = nx - intX;
    const fracY = ny - intY;
    
    const a = this.noise(intX, intY);
    const b = this.noise(intX + 1, intY);
    const c = this.noise(intX, intY + 1);
    const d = this.noise(intX + 1, intY + 1);
    
    const i1 = this.interpolate(a, b, fracX);
    const i2 = this.interpolate(c, d, fracX);
    
    return this.interpolate(i1, i2, fracY);
  }

  private noise(x: number, y: number): number {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n));
  }

  private interpolate(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
  }

  generateTerrain(): Array<{x: number, y: number, terrainType: string}> {
    const tiles = [];
    
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const elevation = this.getNoiseValue(x, y, 50);
        const moisture = this.getNoiseValue(x, y, 30);
        
        let terrainType = TERRAIN_TYPES.PLAINS;
        
        if (elevation < 0.2) {
          terrainType = TERRAIN_TYPES.LAKE;
        } else if (elevation < 0.3 && moisture > 0.6) {
          terrainType = TERRAIN_TYPES.RIVER;
        } else if (elevation > 0.7) {
          terrainType = TERRAIN_TYPES.MOUNTAIN;
        } else if (moisture > 0.5) {
          terrainType = TERRAIN_TYPES.FOREST;
        }
        
        tiles.push({ x, y, terrainType });
      }
    }
    
    return tiles;
  }

  getTerrainStats(tiles: Array<{terrainType: string}>): Record<string, number> {
    const stats = { plains: 0, forest: 0, mountain: 0, river: 0, lake: 0 };
    
    tiles.forEach(tile => {
      stats[tile.terrainType as keyof typeof stats]++;
    });
    
    return stats;
  }
}