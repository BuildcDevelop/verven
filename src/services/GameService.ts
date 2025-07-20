// ============================================================
// GAME SERVICE - API KOMUNIKACE S CONVEX DATABÁZÍ
// ============================================================

import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  GameState,
  Player,
  Province,
  Alliance,
  MapTile,
  Position,
  ApiResponse,
  TerrainType,
  DEFAULT_MAP_SIZE,
  TERRAIN_COLORS,
  ALLIANCE_COLORS,
  SPAWN_ZONE_RADIUS,
  STARTING_VENY
} from '../types/game-types';

// ============================================================
// HLAVNÍ GAME SERVICE TŘÍDA PRO CONVEX
// ============================================================

export class ConvexGameService {
  private convex: ConvexReactClient;
  private currentPlayerId: string = 'player-1'; // TODO: Get from auth

  constructor(convexClient: ConvexReactClient) {
    this.convex = convexClient;
  }

  // ============================================================
  // VEŘEJNÉ API METODY
  // ============================================================

  async getGameState(): Promise<ApiResponse<GameState>> {
    try {
      const result = await this.convex.query(api.convex_api.getGameState, {});
      return result;
    } catch (error) {
      console.error('Error getting game state:', error);
      return {
        success: false,
        error: 'Chyba při načítání herního stavu'
      };
    }
  }

  async createProvince(name: string, position: Position, playerId: string): Promise<ApiResponse<Province>> {
    try {
      const result = await this.convex.mutation(api.convex_api.createProvince, {
        name,
        ownerId: playerId,
        centerX: position.x,
        centerY: position.y
      });
      return result;
    } catch (error) {
      console.error('Error creating province:', error);
      return {
        success: false,
        error: 'Chyba při vytváření državy'
      };
    }
  }

  async joinAlliance(playerId: string, allianceId: string): Promise<ApiResponse<Alliance>> {
    try {
      const result = await this.convex.mutation(api.convex_api.joinAlliance, {
        playerId,
        allianceId
      });

      if (result.success) {
        // Načti aktualizovanou alianci
        const allianceResult = await this.convex.query(api.convex_api.getAllianceById, {
          allianceId
        });
        
        return allianceResult;
      }

      return result;
    } catch (error) {
      console.error('Error joining alliance:', error);
      return {
        success: false,
        error: 'Chyba při připojování k alianci'
      };
    }
  }

  async getCurrentPlayer(): Promise<ApiResponse<Player>> {
    try {
      const result = await this.convex.query(api.convex_api.getPlayerById, {
        playerId: this.currentPlayerId
      });
      return result;
    } catch (error) {
      console.error('Error getting current player:', error);
      return {
        success: false,
        error: 'Hráč nenalezen'
      };
    }
  }

  async getAvailableSpawnPositions(): Promise<ApiResponse<Position[]>> {
    try {
      const result = await this.convex.query(api.convex_api.getAvailableSpawnPositions, {});
      return result;
    } catch (error) {
      console.error('Error getting spawn positions:', error);
      return {
        success: false,
        error: 'Chyba při načítání spawn pozic'
      };
    }
  }

  // ============================================================
  // SPRÁVA HRÁČŮ
  // ============================================================

  async createPlayer(name: string, email: string, passwordHash: string): Promise<ApiResponse<Player>> {
    try {
      const result = await this.convex.mutation(api.convex_api.createPlayer, {
        name,
        email,
        passwordHash
      });
      return result;
    } catch (error) {
      console.error('Error creating player:', error);
      return {
        success: false,
        error: 'Chyba při vytváření hráče'
      };
    }
  }

  async updatePlayerLastActive(playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.convex.mutation(api.convex_api.updatePlayerLastActive, {
        playerId
      });
      return result;
    } catch (error) {
      console.error('Error updating last active:', error);
      return {
        success: false,
        error: 'Chyba při aktualizaci aktivity'
      };
    }
  }

  // ============================================================
  // SPRÁVA ALIANCÍ
  // ============================================================

  async createAlliance(name: string, leaderId: string, description?: string): Promise<ApiResponse<Alliance>> {
    try {
      const result = await this.convex.mutation(api.convex_api.createAlliance, {
        name,
        leaderId,
        description
      });
      return result;
    } catch (error) {
      console.error('Error creating alliance:', error);
      return {
        success: false,
        error: 'Chyba při vytváření aliance'
      };
    }
  }

  async getAllianceById(allianceId: string): Promise<ApiResponse<Alliance>> {
    try {
      const result = await this.convex.query(api.convex_api.getAllianceById, {
        allianceId
      });
      return result;
    } catch (error) {
      console.error('Error getting alliance:', error);
      return {
        success: false,
        error: 'Chyba při načítání aliance'
      };
    }
  }

  // ============================================================
  // SPRÁVA DRŽAV
  // ============================================================

  async getProvinceById(provinceId: string): Promise<ApiResponse<Province>> {
    try {
      const result = await this.convex.query(api.convex_api.getProvinceById, {
        provinceId
      });
      return result;
    } catch (error) {
      console.error('Error getting province:', error);
      return {
        success: false,
        error: 'Chyba při načítání državy'
      };
    }
  }

  // ============================================================
  // SPRÁVA MAPY
  // ============================================================

  async getMapTile(x: number, y: number): Promise<ApiResponse<MapTile>> {
    try {
      const result = await this.convex.query(api.convex_api.getMapTile, {
        x,
        y
      });
      return result;
    } catch (error) {
      console.error('Error getting map tile:', error);
      return {
        success: false,
        error: 'Chyba při načítání políčka'
      };
    }
  }

  // ============================================================
  // ALIAČNÍ SYSTÉM (pokročilé funkce)
  // ============================================================

  async inviteToAlliance(allianceId: string, inviterId: string, targetPlayerId: string, message?: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.convex.mutation(api.convex_alliance_system.invitePlayer, {
        allianceId,
        inviterId,
        targetPlayerId,
        message
      });
      return result;
    } catch (error) {
      console.error('Error inviting to alliance:', error);
      return {
        success: false,
        error: 'Chyba při odesílání pozvánky'
      };
    }
  }

  async respondToInvitation(invitationId: string, playerId: string, response: 'accept' | 'decline'): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.convex.mutation(api.convex_alliance_system.respondToInvitation, {
        invitationId,
        playerId,
        response
      });
      return result;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      return {
        success: false,
        error: 'Chyba při odpovídání na pozvánku'
      };
    }
  }

  async kickFromAlliance(allianceId: string, kickerId: string, targetPlayerId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.convex.mutation(api.convex_alliance_system.kickPlayer, {
        allianceId,
        kickerId,
        targetPlayerId
      });
      return result;
    } catch (error) {
      console.error('Error kicking from alliance:', error);
      return {
        success: false,
        error: 'Chyba při vyhazování z aliance'
      };
    }
  }

  async getAllianceStats(allianceId: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.convex.query(api.convex_alliance_system.getAllianceStats, {
        allianceId
      });
      return result;
    } catch (error) {
      console.error('Error getting alliance stats:', error);
      return {
        success: false,
        error: 'Chyba při načítání statistik aliance'
      };
    }
  }

  async getPlayerInvitations(playerId: string): Promise<ApiResponse<any[]>> {
    try {
      const result = await this.convex.query(api.convex_alliance_system.getPlayerInvitations, {
        playerId
      });
      return result;
    } catch (error) {
      console.error('Error getting player invitations:', error);
      return {
        success: false,
        error: 'Chyba při načítání pozvánek'
      };
    }
  }

  async getAllianceRankings(): Promise<ApiResponse<any[]>> {
    try {
      const result = await this.convex.query(api.convex_alliance_system.getAllianceRankings, {});
      return result;
    } catch (error) {
      console.error('Error getting alliance rankings:', error);
      return {
        success: false,
        error: 'Chyba při načítání žebříčku aliancí'
      };
    }
  }

  // ============================================================
  // SPRÁVA DATABÁZE A SETUP
  // ============================================================

  async setupDatabase(resetData: boolean = false): Promise<ApiResponse<any>> {
    try {
      const result = await this.convex.mutation(api.convex_setup.setupGameDatabase, {
        resetData,
        createSampleData: true,
        generateTerrain: true
      });
      return result;
    } catch (error) {
      console.error('Error setting up database:', error);
      return {
        success: false,
        error: 'Chyba při inicializaci databáze'
      };
    }
  }

  async getDatabaseStats(): Promise<ApiResponse<any>> {
    try {
      const result = await this.convex.query(api.convex_setup.getDatabaseStats, {});
      return result;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        success: false,
        error: 'Chyba při načítání statistik databáze'
      };
    }
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const result = await this.convex.query(api.convex_setup.healthCheck, {});
      return result;
    } catch (error) {
      console.error('Error during health check:', error);
      return {
        success: false,
        error: 'Chyba při kontrole stavu databáze'
      };
    }
  }

  // ============================================================
  // HELPER METODY
  // ============================================================

  // Pro development - set current player
  setCurrentPlayer(playerId: string): void {
    this.currentPlayerId = playerId;
  }

  getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }

  // Kontrola připojení k Convex
  isConnected(): boolean {
    return this.convex.connectionState.isConnected;
  }

  // Získání connection state
  getConnectionState() {
    return this.convex.connectionState;
  }
}

// ============================================================
// FALLBACK MOCK SERVICE (pro development bez Convex)
// ============================================================

export class MockGameService {
  private mockGameState: GameState;
  private currentPlayerId: string = 'player-1';

  constructor() {
    this.mockGameState = this.initializeMockGameState();
  }

  private initializeMockGameState(): GameState {
    const map = this.generateMap();
    const players = this.generateMockPlayers();
    const alliances = this.generateMockAlliances();
    const provinces = this.generateMockProvinces(map, players, alliances);

    return {
      map,
      players,
      alliances,
      provinces,
      buildings: [],
      units: [],
      currentPlayer: players[0],
      gameSettings: {
        mapSize: DEFAULT_MAP_SIZE,
        maxPlayers: 100,
        startingVeny: STARTING_VENY,
        spawnZoneRadius: SPAWN_ZONE_RADIUS,
        allianceColorsEnabled: true
      }
    };
  }

  private generateMap(): MapTile[][] {
    const { width, height } = DEFAULT_MAP_SIZE;
    const map: MapTile[][] = [];

    for (let y = 0; y < height; y++) {
      const row: MapTile[] = [];
      for (let x = 0; x < width; x++) {
        const terrain = this.generateTerrain(x, y);
        const tile: MapTile = {
          id: `tile-${x}-${y}`,
          position: { x, y },
          terrain,
          unitIds: [],
          isSpawnZone: false,
          lastUpdated: new Date()
        };
        row.push(tile);
      }
      map.push(row);
    }

    this.markSpawnZones(map);
    return map;
  }

  private generateTerrain(x: number, y: number): TerrainType {
    const random = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.5;
    
    if (random > 0.7) return TerrainType.MOUNTAIN;
    if (random > 0.4) return TerrainType.FOREST;
    if (random > 0.1) return TerrainType.PLAINS;
    if (random > -0.2) return TerrainType.DESERT;
    if (random > -0.5) return TerrainType.SWAMP;
    return TerrainType.WATER;
  }

  private markSpawnZones(map: MapTile[][]): void {
    const { width, height } = DEFAULT_MAP_SIZE;
    const spawnCenters = [
      { x: 5, y: 5 },
      { x: width - 6, y: 5 },
      { x: 5, y: height - 6 },
      { x: width - 6, y: height - 6 },
      { x: Math.floor(width / 2), y: Math.floor(height / 2) }
    ];

    spawnCenters.forEach(center => {
      for (let dy = -SPAWN_ZONE_RADIUS; dy <= SPAWN_ZONE_RADIUS; dy++) {
        for (let dx = -SPAWN_ZONE_RADIUS; dx <= SPAWN_ZONE_RADIUS; dx++) {
          const x = center.x + dx;
          const y = center.y + dy;
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= SPAWN_ZONE_RADIUS) {
              map[y][x].isSpawnZone = true;
              if (Math.random() > 0.3) {
                map[y][x].terrain = TerrainType.PLAINS;
              }
            }
          }
        }
      }
    });
  }

  private generateMockPlayers(): Player[] {
    return [
      {
        id: 'player-1',
        name: 'Hráč 1',
        email: 'hrac1@example.com',
        allianceId: 'alliance-1',
        color: ALLIANCE_COLORS[0],
        veny: STARTING_VENY,
        provinces: ['province-1'],
        createdAt: new Date(),
        lastActive: new Date()
      },
      {
        id: 'player-2', 
        name: 'Hráč 2',
        email: 'hrac2@example.com',
        allianceId: 'alliance-1',
        color: ALLIANCE_COLORS[0],
        veny: STARTING_VENY,
        provinces: ['province-2'],
        createdAt: new Date(),
        lastActive: new Date()
      },
      {
        id: 'player-3',
        name: 'Hráč 3', 
        email: 'hrac3@example.com',
        allianceId: 'alliance-2',
        color: ALLIANCE_COLORS[1],
        veny: STARTING_VENY,
        provinces: ['province-3'],
        createdAt: new Date(),
        lastActive: new Date()
      }
    ];
  }

  private generateMockAlliances(): Alliance[] {
    return [
      {
        id: 'alliance-1',
        name: 'Červení Draci',
        color: ALLIANCE_COLORS[0],
        leaderId: 'player-1',
        memberIds: ['player-1', 'player-2'],
        description: 'Mocná aliance severu',
        createdAt: new Date()
      },
      {
        id: 'alliance-2',
        name: 'Modří Vlci',
        color: ALLIANCE_COLORS[1], 
        leaderId: 'player-3',
        memberIds: ['player-3'],
        description: 'Strážci východních hranic',
        createdAt: new Date()
      }
    ];
  }

  private generateMockProvinces(map: MapTile[][], players: Player[], alliances: Alliance[]): Province[] {
    const provinces: Province[] = [];
    
    players.forEach((player, index) => {
      const alliance = alliances.find(a => a.id === player.allianceId);
      const spawnPositions = [
        { x: 7, y: 7 },
        { x: 23, y: 7 },
        { x: 7, y: 23 }
      ];
      
      const position = spawnPositions[index] || { x: 15, y: 15 };
      
      const province: Province = {
        id: `province-${index + 1}`,
        name: `${player.name} - Domovská država`,
        ownerId: player.id,
        allianceId: player.allianceId,
        color: alliance?.color || player.color,
        centerPosition: position,
        tileIds: this.getProvinceTiles(position, map),
        population: 1000,
        resources: 500,
        buildings: [],
        createdAt: new Date()
      };
      
      provinces.push(province);
      this.assignTilesToProvince(map, province);
    });
    
    return provinces;
  }

  private getProvinceTiles(center: Position, map: MapTile[][]): string[] {
    const tileIds: string[] = [];
    const radius = 2;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = center.x + dx;
        const y = center.y + dy;
        
        if (x >= 0 && x < DEFAULT_MAP_SIZE.width && 
            y >= 0 && y < DEFAULT_MAP_SIZE.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            tileIds.push(`tile-${x}-${y}`);
          }
        }
      }
    }
    
    return tileIds;
  }

  private assignTilesToProvince(map: MapTile[][], province: Province): void {
    province.tileIds.forEach(tileId => {
      const [, x, y] = tileId.split('-').map(Number);
      if (map[y] && map[y][x]) {
        map[y][x].ownerId = province.ownerId;
        map[y][x].provinceId = province.id;
      }
    });
  }

  // Implementace stejných metod jako ConvexGameService
  async getGameState(): Promise<ApiResponse<GameState>> {
    await this.delay(500);
    return { success: true, data: this.mockGameState };
  }

  async createProvince(name: string, position: Position, playerId: string): Promise<ApiResponse<Province>> {
    await this.delay(300);
    // ... stejná implementace jako předtím
    const player = this.mockGameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Hráč nenalezen' };
    }

    const alliance = this.mockGameState.alliances.find(a => a.id === player.allianceId);
    
    const newProvince: Province = {
      id: `province-${Date.now()}`,
      name,
      ownerId: playerId,
      allianceId: player.allianceId,
      color: alliance?.color || player.color,
      centerPosition: position,
      tileIds: this.getProvinceTiles(position, this.mockGameState.map),
      population: 100,
      resources: 50,
      buildings: [],
      createdAt: new Date()
    };

    this.mockGameState.provinces.push(newProvince);
    this.assignTilesToProvince(this.mockGameState.map, newProvince);
    player.provinces.push(newProvince.id);
    
    return {
      success: true,
      data: newProvince,
      message: 'Država byla úspěšně vytvořena!'
    };
  }

  async joinAlliance(playerId: string, allianceId: string): Promise<ApiResponse<Alliance>> {
    await this.delay(300);
    // ... stejná implementace jako předtím
    const player = this.mockGameState.players.find(p => p.id === playerId);
    const alliance = this.mockGameState.alliances.find(a => a.id === allianceId);
    
    if (!player || !alliance) {
      return { success: false, error: 'Hráč nebo aliance nenalezena' };
    }

    if (player.allianceId) {
      const oldAlliance = this.mockGameState.alliances.find(a => a.id === player.allianceId);
      if (oldAlliance) {
        oldAlliance.memberIds = oldAlliance.memberIds.filter(id => id !== playerId);
      }
    }

    player.allianceId = allianceId;
    player.color = alliance.color;
    alliance.memberIds.push(playerId);

    player.provinces.forEach(provinceId => {
      const province = this.mockGameState.provinces.find(p => p.id === provinceId);
      if (province) {
        province.allianceId = allianceId;
        province.color = alliance.color;
      }
    });

    return {
      success: true,
      data: alliance,
      message: 'Úspěšně jste se připojili k alianci!'
    };
  }

  async getCurrentPlayer(): Promise<ApiResponse<Player>> {
    await this.delay(200);
    const player = this.mockGameState.players.find(p => p.id === this.currentPlayerId);
    if (!player) {
      return { success: false, error: 'Hráč nenalezen' };
    }
    return { success: true, data: player };
  }

  async getAvailableSpawnPositions(): Promise<ApiResponse<Position[]>> {
    await this.delay(200);
    const spawnPositions: Position[] = [];
    const { map } = this.mockGameState;
    
    map.forEach(row => {
      row.forEach(tile => {
        if (tile.isSpawnZone && !tile.ownerId) {
          spawnPositions.push(tile.position);
        }
      });
    });
    
    return { success: true, data: spawnPositions };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setCurrentPlayer(playerId: string): void {
    this.currentPlayerId = playerId;
  }

  resetGameState(): void {
    this.mockGameState = this.initializeMockGameState();
  }
}

// ============================================================
// FACTORY FUNKCE PRO VYTVOŘENÍ SPRÁVNÉHO SERVICE
// ============================================================

export function createGameService(convexClient?: ConvexReactClient): ConvexGameService | MockGameService {
  if (convexClient) {
    return new ConvexGameService(convexClient);
  } else {
    console.warn('Convex client not provided, using mock service');
    return new MockGameService();
  }
}

// Singleton pro zpětnou kompatibilitu (mock service)
export const gameService = new MockGameService();