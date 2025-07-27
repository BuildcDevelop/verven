// ============================================================
// DATABÁZOVÉ API PRO HERNÍ APLIKACI
// ============================================================

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import {
  Player,
  Alliance,
  Province,
  MapTile,
  Building,
  Unit,
  GameAction,
  Position,
  ApiResponse,
  TerrainType,
  GameState,
  DEFAULT_MAP_SIZE,
  STARTING_VENY,
  ALLIANCE_COLORS
} from '../types/game-types';

// ============================================================
// DATABÁZOVÁ TŘÍDA S PROMISE WRAPPERY
// ============================================================

export class GameDatabase {
  private db: sqlite3.Database;
  private dbRun: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  private dbGet: (sql: string, params?: any[]) => Promise<any>;
  private dbAll: (sql: string, params?: any[]) => Promise<any[]>;

  constructor(dbPath: string = './game.db') {
    this.db = new sqlite3.Database(dbPath);
    
    // Promisify databázové operace
    this.dbRun = promisify(this.db.run.bind(this.db));
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
  }

  // ============================================================
  // SPRÁVA HRÁČŮ
  // ============================================================

  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'lastActive'>): Promise<ApiResponse<Player>> {
    try {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sql = `
        INSERT INTO players (id, name, email, password_hash, color, veny)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await this.dbRun(sql, [
        playerId,
        playerData.name,
        playerData.email,
        'hashed_password', // TODO: implement proper password hashing
        playerData.color || ALLIANCE_COLORS[0],
        STARTING_VENY
      ]);

      const player = await this.getPlayerById(playerId);
      
      if (player.success && player.data) {
        // Vytvoř počáteční provincii pro nového hráče
        await this.createStartingProvince(player.data);
        
        return {
          success: true,
          data: player.data,
          message: 'Hráč byl úspěšně vytvořen'
        };
      }
      
      return { success: false, error: 'Chyba při vytváření hráče' };
    } catch (error) {
      console.error('Database error creating player:', error);
      return { success: false, error: 'Databázová chyba při vytváření hráče' };
    }
  }

  async getPlayerById(playerId: string): Promise<ApiResponse<Player>> {
    try {
      const sql = `
        SELECT p.*, 
               (SELECT json_group_array(pr.id) FROM provinces pr WHERE pr.owner_id = p.id) as provinces
        FROM players p
        WHERE p.id = ?
      `;
      
      const row = await this.dbGet(sql, [playerId]);
      
      if (!row) {
        return { success: false, error: 'Hráč nenalezen' };
      }

      const player: Player = {
        id: row.id,
        name: row.name,
        email: row.email,
        allianceId: row.alliance_id,
        color: row.color,
        veny: row.veny,
        provinces: JSON.parse(row.provinces || '[]'),
        createdAt: new Date(row.created_at),
        lastActive: new Date(row.last_active)
      };

      return { success: true, data: player };
    } catch (error) {
      console.error('Database error getting player:', error);
      return { success: false, error: 'Databázová chyba při načítání hráče' };
    }
  }

  async updatePlayerLastActive(playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const sql = 'UPDATE players SET last_active = CURRENT_TIMESTAMP WHERE id = ?';
      await this.dbRun(sql, [playerId]);
      
      return { success: true, data: true };
    } catch (error) {
      console.error('Database error updating last active:', error);
      return { success: false, error: 'Chyba při aktualizaci aktivity' };
    }
  }

  // ============================================================
  // SPRÁVA ALIANCÍ
  // ============================================================

  async createAlliance(allianceData: Omit<Alliance, 'id' | 'createdAt'>): Promise<ApiResponse<Alliance>> {
    try {
      const allianceId = `alliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sql = `
        INSERT INTO alliances (id, name, color, leader_id, description)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.dbRun(sql, [
        allianceId,
        allianceData.name,
        allianceData.color,
        allianceData.leaderId,
        allianceData.description
      ]);

      // Přidej leadera jako člena
      await this.addAllianceMember(allianceId, allianceData.leaderId, 'leader');
      
      const alliance = await this.getAllianceById(allianceId);
      return alliance;
    } catch (error) {
      console.error('Database error creating alliance:', error);
      return { success: false, error: 'Databázová chyba při vytváření aliance' };
    }
  }

  async getAllianceById(allianceId: string): Promise<ApiResponse<Alliance>> {
    try {
      const sql = `
        SELECT a.*,
               json_group_array(am.player_id) as member_ids
        FROM alliances a
        LEFT JOIN alliance_members am ON a.id = am.alliance_id
        WHERE a.id = ?
        GROUP BY a.id
      `;
      
      const row = await this.dbGet(sql, [allianceId]);
      
      if (!row) {
        return { success: false, error: 'Aliance nenalezena' };
      }

      const alliance: Alliance = {
        id: row.id,
        name: row.name,
        color: row.color,
        leaderId: row.leader_id,
        memberIds: JSON.parse(row.member_ids || '[]').filter((id: string) => id !== null),
        description: row.description,
        createdAt: new Date(row.created_at)
      };

      return { success: true, data: alliance };
    } catch (error) {
      console.error('Database error getting alliance:', error);
      return { success: false, error: 'Databázová chyba při načítání aliance' };
    }
  }

  async joinAlliance(playerId: string, allianceId: string): Promise<ApiResponse<boolean>> {
    try {
      // Odstraň z předchozí aliance
      await this.leaveAlliance(playerId);
      
      // Přidej do nové aliance
      await this.addAllianceMember(allianceId, playerId, 'member');
      
      // Aktualizuj hráče
      const allianceResult = await this.getAllianceById(allianceId);
      if (allianceResult.success && allianceResult.data) {
        const updateSql = `
          UPDATE players 
          SET alliance_id = ?, color = ? 
          WHERE id = ?
        `;
        await this.dbRun(updateSql, [allianceId, allianceResult.data.color, playerId]);
        
        // Aktualizuj barvy provincií
        await this.updateProvinceColors(playerId, allianceResult.data.color);
      }
      
      return { success: true, data: true, message: 'Úspěšně jste se připojili k alianci' };
    } catch (error) {
      console.error('Database error joining alliance:', error);
      return { success: false, error: 'Chyba při připojování k alianci' };
    }
  }

  async leaveAlliance(playerId: string): Promise<ApiResponse<boolean>> {
    try {
      // Odstranit z alliance_members
      const deleteSql = 'DELETE FROM alliance_members WHERE player_id = ?';
      await this.dbRun(deleteSql, [playerId]);
      
      // Aktualizovat hráče
      const updateSql = 'UPDATE players SET alliance_id = NULL WHERE id = ?';
      await this.dbRun(updateSql, [playerId]);
      
      return { success: true, data: true };
    } catch (error) {
      console.error('Database error leaving alliance:', error);
      return { success: false, error: 'Chyba při opouštění aliance' };
    }
  }

  private async addAllianceMember(allianceId: string, playerId: string, role: string = 'member'): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO alliance_members (alliance_id, player_id, role)
      VALUES (?, ?, ?)
    `;
    await this.dbRun(sql, [allianceId, playerId, role]);
  }

  // ============================================================
  // SPRÁVA DRŽAV
  // ============================================================

  async createProvince(provinceData: Omit<Province, 'id' | 'createdAt'>): Promise<ApiResponse<Province>> {
    try {
      const provinceId = `province-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sql = `
        INSERT INTO provinces (id, name, owner_id, alliance_id, color, center_x, center_y, population, resources)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.dbRun(sql, [
        provinceId,
        provinceData.name,
        provinceData.ownerId,
        provinceData.allianceId,
        provinceData.color,
        provinceData.centerPosition.x,
        provinceData.centerPosition.y,
        provinceData.population,
        provinceData.resources
      ]);

      // Vytvoř území kolem provincie
      await this.createProvinceTerritory(provinceId, provinceData.centerPosition, provinceData.ownerId);
      
      const province = await this.getProvinceById(provinceId);
      return province;
    } catch (error) {
      console.error('Database error creating province:', error);
      return { success: false, error: 'Databázová chyba při vytváření državy' };
    }
  }

  async getProvinceById(provinceId: string): Promise<ApiResponse<Province>> {
    try {
      const sql = `
        SELECT p.*,
               json_group_array(mt.id) as tile_ids,
               json_group_array(b.id) as building_ids
        FROM provinces p
        LEFT JOIN map_tiles mt ON p.id = mt.province_id
        LEFT JOIN buildings b ON p.id = b.province_id
        WHERE p.id = ?
        GROUP BY p.id
      `;
      
      const row = await this.dbGet(sql, [provinceId]);
      
      if (!row) {
        return { success: false, error: 'Država nenalezena' };
      }

      const province: Province = {
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        allianceId: row.alliance_id,
        color: row.color,
        centerPosition: { x: row.center_x, y: row.center_y },
        tileIds: JSON.parse(row.tile_ids || '[]').filter((id: string) => id !== null),
        population: row.population,
        resources: row.resources,
        buildings: JSON.parse(row.building_ids || '[]').filter((id: string) => id !== null),
        createdAt: new Date(row.created_at)
      };

      return { success: true, data: province };
    } catch (error) {
      console.error('Database error getting province:', error);
      return { success: false, error: 'Databázová chyba při načítání državy' };
    }
  }

  private async createProvinceTerritory(provinceId: string, center: Position, ownerId: string): Promise<void> {
    const radius = 2;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = center.x + dx;
        const y = center.y + dy;
        
        if (x >= 0 && x < DEFAULT_MAP_SIZE.width && 
            y >= 0 && y < DEFAULT_MAP_SIZE.height) {
          
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const sql = `
              UPDATE map_tiles 
              SET owner_id = ?, province_id = ? 
              WHERE x = ? AND y = ?
            `;
            await this.dbRun(sql, [ownerId, provinceId, x, y]);
          }
        }
      }
    }
  }

  private async updateProvinceColors(playerId: string, newColor: string): Promise<void> {
    const sql = `
      UPDATE provinces 
      SET color = ?, alliance_id = (SELECT alliance_id FROM players WHERE id = ?)
      WHERE owner_id = ?
    `;
    await this.dbRun(sql, [newColor, playerId, playerId]);
  }

  // ============================================================
  // SPRÁVA MAPY
  // ============================================================

  async createMapTile(tileData: Omit<MapTile, 'id' | 'lastUpdated'>): Promise<ApiResponse<MapTile>> {
    try {
      const tileId = `tile-${tileData.position.x}-${tileData.position.y}`;
      
      const sql = `
        INSERT OR REPLACE INTO map_tiles 
        (id, x, y, terrain_type, owner_id, province_id, is_spawn_zone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.dbRun(sql, [
        tileId,
        tileData.position.x,
        tileData.position.y,
        tileData.terrain,
        tileData.ownerId,
        tileData.provinceId,
        tileData.isSpawnZone
      ]);

      const tile = await this.getMapTile(tileData.position.x, tileData.position.y);
      return tile;
    } catch (error) {
      console.error('Database error creating map tile:', error);
      return { success: false, error: 'Databázová chyba při vytváření políčka mapy' };
    }
  }

  async getMapTile(x: number, y: number): Promise<ApiResponse<MapTile>> {
    try {
      const sql = `
        SELECT mt.*,
               json_group_array(u.id) as unit_ids
        FROM map_tiles mt
        LEFT JOIN units u ON mt.x = u.x AND mt.y = u.y
        WHERE mt.x = ? AND mt.y = ?
        GROUP BY mt.id
      `;
      
      const row = await this.dbGet(sql, [x, y]);
      
      if (!row) {
        return { success: false, error: 'Políčko nenalezeno' };
      }

      const tile: MapTile = {
        id: row.id,
        position: { x: row.x, y: row.y },
        terrain: row.terrain_type as TerrainType,
        ownerId: row.owner_id,
        provinceId: row.province_id,
        buildingId: row.building_id,
        unitIds: JSON.parse(row.unit_ids || '[]').filter((id: string) => id !== null),
        isSpawnZone: row.is_spawn_zone === 1,
        lastUpdated: new Date(row.last_updated)
      };

      return { success: true, data: tile };
    } catch (error) {
      console.error('Database error getting map tile:', error);
      return { success: false, error: 'Databázová chyba při načítání políčka' };
    }
  }

  async getCompleteMap(): Promise<ApiResponse<MapTile[][]>> {
    try {
      const sql = `
        SELECT mt.*,
               json_group_array(u.id) as unit_ids
        FROM map_tiles mt
        LEFT JOIN units u ON mt.x = u.x AND mt.y = u.y
        GROUP BY mt.id
        ORDER BY mt.y, mt.x
      `;
      
      const rows = await this.dbAll(sql);
      
      const map: MapTile[][] = [];
      
      // Inicializuj mapu
      for (let y = 0; y < DEFAULT_MAP_SIZE.height; y++) {
        map[y] = [];
      }
      
      // Naplň mapu daty
      rows.forEach(row => {
        const tile: MapTile = {
          id: row.id,
          position: { x: row.x, y: row.y },
          terrain: row.terrain_type as TerrainType,
          ownerId: row.owner_id,
          provinceId: row.province_id,
          buildingId: row.building_id,
          unitIds: JSON.parse(row.unit_ids || '[]').filter((id: string) => id !== null),
          isSpawnZone: row.is_spawn_zone === 1,
          lastUpdated: new Date(row.last_updated)
        };
        
        map[row.y][row.x] = tile;
      });

      return { success: true, data: map };
    } catch (error) {
      console.error('Database error getting complete map:', error);
      return { success: false, error: 'Databázová chyba při načítání mapy' };
    }
  }

  // ============================================================
  // KOMPLETNÍ HERNÍ STAV
  // ============================================================

  async getGameState(): Promise<ApiResponse<GameState>> {
    try {
      // Načti všechny komponenty herního stavu paralelně
      const [mapResult, playersResult, alliancesResult, provincesResult] = await Promise.all([
        this.getCompleteMap(),
        this.getAllPlayers(),
        this.getAllAlliances(),
        this.getAllProvinces()
      ]);

      if (!mapResult.success || !playersResult.success || 
          !alliancesResult.success || !provincesResult.success) {
        return { success: false, error: 'Chyba při načítání komponenty herního stavu' };
      }

      const gameState: GameState = {
        map: mapResult.data!,
        players: playersResult.data!,
        alliances: alliancesResult.data!,
        provinces: provincesResult.data!,
        buildings: [], // TODO: implementovat
        units: [], // TODO: implementovat
        currentPlayer: undefined, // Nastaví se podle session
        gameSettings: {
          mapSize: DEFAULT_MAP_SIZE,
          maxPlayers: 100,
          startingVeny: STARTING_VENY,
          spawnZoneRadius: 3,
          allianceColorsEnabled: true
        }
      };

      return { success: true, data: gameState };
    } catch (error) {
      console.error('Database error getting game state:', error);
      return { success: false, error: 'Databázová chyba při načítání herního stavu' };
    }
  }

  // ============================================================
  // HELPER FUNKCE
  // ============================================================

  private async getAllPlayers(): Promise<ApiResponse<Player[]>> {
    try {
      const sql = `
        SELECT p.*,
               json_group_array(pr.id) as provinces
        FROM players p
        LEFT JOIN provinces pr ON p.id = pr.owner_id
        GROUP BY p.id
        ORDER BY p.created_at
      `;
      
      const rows = await this.dbAll(sql);
      
      const players: Player[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        allianceId: row.alliance_id,
        color: row.color,
        veny: row.veny,
        provinces: JSON.parse(row.provinces || '[]').filter((id: string) => id !== null),
        createdAt: new Date(row.created_at),
        lastActive: new Date(row.last_active)
      }));

      return { success: true, data: players };
    } catch (error) {
      console.error('Database error getting all players:', error);
      return { success: false, error: 'Databázová chyba při načítání hráčů' };
    }
  }

  private async getAllAlliances(): Promise<ApiResponse<Alliance[]>> {
    try {
      const sql = `
        SELECT a.*,
               json_group_array(am.player_id) as member_ids
        FROM alliances a
        LEFT JOIN alliance_members am ON a.id = am.alliance_id
        GROUP BY a.id
        ORDER BY a.created_at
      `;
      
      const rows = await this.dbAll(sql);
      
      const alliances: Alliance[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        color: row.color,
        leaderId: row.leader_id,
        memberIds: JSON.parse(row.member_ids || '[]').filter((id: string) => id !== null),
        description: row.description,
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: alliances };
    } catch (error) {
      console.error('Database error getting all alliances:', error);
      return { success: false, error: 'Databázová chyba při načítání aliancí' };
    }
  }

  private async getAllProvinces(): Promise<ApiResponse<Province[]>> {
    try {
      const sql = `
        SELECT p.*,
               json_group_array(DISTINCT mt.id) as tile_ids,
               json_group_array(DISTINCT b.id) as building_ids
        FROM provinces p
        LEFT JOIN map_tiles mt ON p.id = mt.province_id
        LEFT JOIN buildings b ON p.id = b.province_id
        GROUP BY p.id
        ORDER BY p.created_at
      `;
      
      const rows = await this.dbAll(sql);
      
      const provinces: Province[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        allianceId: row.alliance_id,
        color: row.color,
        centerPosition: { x: row.center_x, y: row.center_y },
        tileIds: JSON.parse(row.tile_ids || '[]').filter((id: string) => id !== null),
        population: row.population,
        resources: row.resources,
        buildings: JSON.parse(row.building_ids || '[]').filter((id: string) => id !== null),
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: provinces };
    } catch (error) {
      console.error('Database error getting all provinces:', error);
      return { success: false, error: 'Databázová chyba při načítání držav' };
    }
  }

  // ============================================================
  // POČÁTEČNÍ NASTAVENÍ HRÁČE
  // ============================================================

  private async createStartingProvince(player: Player): Promise<void> {
    try {
      // Najdi volnou spawn pozici
      const spawnPositions = await this.getAvailableSpawnPositions();
      
      if (spawnPositions.length === 0) {
        throw new Error('Žádné volné spawn pozice');
      }

      const spawnPosition = spawnPositions[0];
      
      // Vytvoř počáteční provincii
      const provinceData: Omit<Province, 'id' | 'createdAt'> = {
        name: `${player.name} - Domovská država`,
        ownerId: player.id,
        allianceId: player.allianceId,
        color: player.color,
        centerPosition: spawnPosition,
        tileIds: [],
        population: 100,
        resources: 100,
        buildings: []
      };

      await this.createProvince(provinceData);
    } catch (error) {
      console.error('Error creating starting province:', error);
    }
  }

  private async getAvailableSpawnPositions(): Promise<Position[]> {
    try {
      const sql = `
        SELECT x, y 
        FROM map_tiles 
        WHERE is_spawn_zone = 1 AND owner_id IS NULL
        ORDER BY RANDOM()
      `;
      
      const rows = await this.dbAll(sql);
      
      return rows.map(row => ({ x: row.x, y: row.y }));
    } catch (error) {
      console.error('Database error getting spawn positions:', error);
      return [];
    }
  }

  // ============================================================
  // ZAVŘENÍ DATABÁZE
  // ============================================================

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Singleton instance
export const gameDatabase = new GameDatabase();