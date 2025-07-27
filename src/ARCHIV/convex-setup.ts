// ============================================================
// CONVEX SETUP SCRIPT PRO INICIALIZACI HERNÍ DATABÁZE
// ============================================================

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { TerrainGenerator, DEFAULT_TERRAIN_CONFIG } from './terrain-generator';
import {
  DEFAULT_MAP_SIZE,
  TerrainType,
  ALLIANCE_COLORS,
  STARTING_VENY
} from '../types/game-types';

// ============================================================
// HLAVNÍ SETUP MUTATION
// ============================================================

export const setupGameDatabase = mutation({
  args: {
    resetData: v.optional(v.boolean()),
    createSampleData: v.optional(v.boolean()),
    generateTerrain: v.optional(v.boolean())
  },
  handler: async (ctx, { resetData = false, createSampleData = true, generateTerrain = true }) => {
    try {
      console.log('🚀 Spouštím Convex setup...');

      // Krok 1: Reset dat (pokud je požadován)
      if (resetData) {
        await resetAllData(ctx);
      }

      // Krok 2: Inicializace herních nastavení
      await initializeGameSettings(ctx);

      // Krok 3: Generování herní mapy
      if (generateTerrain) {
        await generateGameMap(ctx);
      }

      // Krok 4: Vytvoření ukázkových dat
      if (createSampleData) {
        await createSampleData(ctx);
      }

      console.log('✅ Convex setup dokončen úspěšně!');
      
      return {
        success: true,
        message: 'Databáze byla úspěšně inicializována',
        data: {
          mapSize: DEFAULT_MAP_SIZE,
          sampleDataCreated: createSampleData,
          terrainGenerated: generateTerrain
        }
      };

    } catch (error) {
      console.error('❌ Chyba během Convex setupu:', error);
      return {
        success: false,
        error: 'Chyba při inicializaci databáze',
        details: error.message
      };
    }
  },
});

// ============================================================
// RESET VŠECH DAT
// ============================================================

async function resetAllData(ctx: any): Promise<void> {
  console.log('🗑️ Resetování všech dat...');

  const tablesToClear = [
    'game_actions',
    'units', 
    'buildings',
    'map_tiles',
    'provinces',
    'alliance_members',
    'alliance_invitations',
    'alliance_relations',
    'alliances',
    'players',
    'notifications',
    'chat_messages',
    'market_offers',
    'game_settings'
  ];

  for (const tableName of tablesToClear) {
    try {
      const documents = await ctx.db.query(tableName).collect();
      for (const doc of documents) {
        await ctx.db.delete(doc._id);
      }
      console.log(`  ✅ Vymazána tabulka: ${tableName} (${documents.length} záznamů)`);
    } catch (error) {
      console.log(`  ⚠️ Chyba při mazání ${tableName}:`, error.message);
    }
  }
}

// ============================================================
// INICIALIZACE HERNÍCH NASTAVENÍ
// ============================================================

async function initializeGameSettings(ctx: any): Promise<void> {
  console.log('⚙️ Inicializace herních nastavení...');

  const defaultSettings = [
    { key: 'map_width', value: '30', description: 'Šířka herní mapy' },
    { key: 'map_height', value: '30', description: 'Výška herní mapy' },
    { key: 'max_players', value: '100', description: 'Maximální počet hráčů' },
    { key: 'starting_veny', value: '1000', description: 'Počáteční množství herní měny' },
    { key: 'spawn_zone_radius', value: '3', description: 'Poloměr spawn zón' },
    { key: 'alliance_colors_enabled', value: 'true', description: 'Povolení aliančních barev' },
    { key: 'game_version', value: '1.0.0', description: 'Verze hry' },
    { key: 'maintenance_mode', value: 'false', description: 'Režim údržby' }
  ];

  for (const setting of defaultSettings) {
    // Zkontroluj, jestli nastavení už neexistuje
    const existing = await ctx.db
      .query('game_settings')
      .withIndex('by_key', (q) => q.eq('setting_key', setting.key))
      .first();

    if (!existing) {
      await ctx.db.insert('game_settings', {
        setting_key: setting.key,
        setting_value: setting.value,
        description: setting.description
      });
    }
  }

  console.log('✅ Herní nastavení inicializována');
}

// ============================================================
// GENEROVÁNÍ HERNÍ MAPY
// ============================================================

async function generateGameMap(ctx: any): Promise<void> {
  console.log('🗺️ Generování herní mapy...');

  try {
    const generator = new TerrainGenerator(DEFAULT_MAP_SIZE, {
      ...DEFAULT_TERRAIN_CONFIG,
      seed: Math.random()
    });

    // Vygeneruj terén
    console.log('  🌍 Generování terénu...');
    const terrain = generator.generateTerrain();

    // Vygeneruj spawn zóny
    console.log('  ✨ Označování spawn zón...');
    const spawnZones = generator.generateSpawnZones(terrain);

    // Ulož mapu do databáze
    console.log('  💾 Ukládání mapy do databáze...');
    await saveMapToDatabase(ctx, terrain, spawnZones);

    console.log(`✅ Mapa vygenerována (${spawnZones.length} spawn zón)`);

  } catch (error) {
    console.error('Chyba při generování mapy:', error);
    throw error;
  }
}

async function saveMapToDatabase(ctx: any, terrain: TerrainType[][], spawnZones: any[]): Promise<void> {
  const { width, height } = DEFAULT_MAP_SIZE;
  let tileCount = 0;
  
  console.log(`  📊 Ukládání ${width * height} políček...`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrainType = terrain[y][x];
      const isSpawnZone = spawnZones.some(spawn => 
        Math.abs(spawn.x - x) <= 3 && Math.abs(spawn.y - y) <= 3
      );

      // Získej vlastnosti terénu
      const properties = getTerrainProperties(terrainType);

      await ctx.db.insert('map_tiles', {
        x,
        y,
        terrain_type: terrainType,
        is_spawn_zone: isSpawnZone,
        movement_cost: properties.movementCost,
        defensive_bonus: properties.defensiveBonus,
        resource_bonus: properties.resourceBonus
      });

      tileCount++;

      // Zobraz pokrok každých 200 políček
      if (tileCount % 200 === 0) {
        console.log(`    💾 Uloženo ${tileCount}/${width * height} políček`);
      }
    }
  }

  console.log(`    ✅ Uloženo celkem ${tileCount} políček`);
}

function getTerrainProperties(terrain: TerrainType) {
  const properties = {
    [TerrainType.PLAINS]: { movementCost: 1, defensiveBonus: 0, resourceBonus: 10 },
    [TerrainType.FOREST]: { movementCost: 2, defensiveBonus: 25, resourceBonus: 5 },
    [TerrainType.MOUNTAIN]: { movementCost: 3, defensiveBonus: 50, resourceBonus: 20 },
    [TerrainType.WATER]: { movementCost: 999, defensiveBonus: 0, resourceBonus: 0 },
    [TerrainType.DESERT]: { movementCost: 2, defensiveBonus: -10, resourceBonus: -5 },
    [TerrainType.SWAMP]: { movementCost: 3, defensiveBonus: 15, resourceBonus: -10 }
  };
  
  return properties[terrain];
}

// ============================================================
// VYTVOŘENÍ UKÁZKOVÝCH DAT
// ============================================================

async function createSampleData(ctx: any): Promise<void> {
  console.log('👥 Vytváření ukázkových dat...');

  try {
    // Vytvoř ukázkové aliance
    const alliances = await createSampleAlliances(ctx);
    
    // Vytvoř ukázkové hráče
    const players = await createSamplePlayers(ctx, alliances);
    
    // Vytvoř ukázkové provincie
    await createSampleProvinces(ctx, players, alliances);

    console.log('✅ Ukázková data vytvořena');

  } catch (error) {
    console.error('Chyba při vytváření ukázkových dat:', error);
    throw error;
  }
}

async function createSampleAlliances(ctx: any): Promise<any[]> {
  console.log('  🤝 Vytváření ukázkových aliancí...');

  const sampleAlliances = [
    {
      name: 'Červení Draci',
      color: ALLIANCE_COLORS[0],
      description: 'Mocná aliance severu'
    },
    {
      name: 'Modří Vlci',
      color: ALLIANCE_COLORS[1],
      description: 'Strážci východních hranic'
    },
    {
      name: 'Zlatí Sokoli',
      color: ALLIANCE_COLORS[2],
      description: 'Obchodníci a průzkumníci'
    }
  ];

  const createdAlliances = [];

  for (const alliance of sampleAlliances) {
    const allianceId = await ctx.db.insert('alliances', {
      name: alliance.name,
      color: alliance.color,
      leader_id: null, // Nastavíme později
      description: alliance.description,
      max_members: 50,
      is_open: true
    });

    createdAlliances.push({
      id: allianceId,
      ...alliance
    });
  }

  return createdAlliances;
}

async function createSamplePlayers(ctx: any, alliances: any[]): Promise<any[]> {
  console.log('  👤 Vytváření ukázkových hráčů...');

  const samplePlayers = [
    {
      name: 'Král Arden',
      email: 'arden@example.com',
      allianceIndex: 0,
      isLeader: true
    },
    {
      name: 'Lady Elara',
      email: 'elara@example.com',
      allianceIndex: 0,
      isLeader: false
    },
    {
      name: 'Vikingský náčelník Bjorn',
      email: 'bjorn@example.com',
      allianceIndex: 1,
      isLeader: true
    },
    {
      name: 'Čarodějka Mira',
      email: 'mira@example.com',
      allianceIndex: 1,
      isLeader: false
    },
    {
      name: 'Obchodník Zarel',
      email: 'zarel@example.com',
      allianceIndex: 2,
      isLeader: true
    }
  ];

  const createdPlayers = [];

  for (const player of samplePlayers) {
    const alliance = alliances[player.allianceIndex];
    
    const playerId = await ctx.db.insert('players', {
      name: player.name,
      email: player.email,
      password_hash: 'hashed_password_placeholder',
      alliance_id: alliance.id,
      color: alliance.color,
      veny: STARTING_VENY,
      experience: Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 5) + 1,
      last_active: Date.now()
    });

    // Přidej do aliance
    await ctx.db.insert('alliance_members', {
      alliance_id: alliance.id,
      player_id: playerId,
      role: player.isLeader ? 'leader' : 'member',
      joined_at: Date.now()
    });

    // Aktualizuj leadera aliance
    if (player.isLeader) {
      await ctx.db.patch(alliance.id, {
        leader_id: playerId
      });
    }

    createdPlayers.push({
      id: playerId,
      ...player,
      allianceId: alliance.id,
      color: alliance.color
    });
  }

  return createdPlayers;
}

async function createSampleProvinces(ctx: any, players: any[], alliances: any[]): Promise<void> {
  console.log('  🏛️ Vytváření ukázkových držav...');

  // Najdi spawn pozice
  const spawnTiles = await ctx.db
    .query('map_tiles')
    .withIndex('by_spawn_zone', (q) => q.eq('is_spawn_zone', true))
    .take(players.length);

  for (let i = 0; i < players.length && i < spawnTiles.length; i++) {
    const player = players[i];
    const spawn = spawnTiles[i];
    const alliance = alliances.find(a => a.id === player.allianceId);

    const provinceId = await ctx.db.insert('provinces', {
      name: `${player.name} - Domovská država`,
      owner_id: player.id,
      alliance_id: player.allianceId,
      color: alliance?.color || player.color,
      center_x: spawn.x,
      center_y: spawn.y,
      population: Math.floor(Math.random() * 500) + 100,
      resources: Math.floor(Math.random() * 200) + 50,
      tax_rate: 0.1,
      happiness: Math.floor(Math.random() * 50) + 50
    });

    // Přiřaď území kolem provincie
    await assignProvinceTerritory(ctx, provinceId, spawn, player.id);
  }
}

async function assignProvinceTerritory(ctx: any, provinceId: string, center: any, ownerId: string): Promise<void> {
  const radius = 2;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      
      if (x >= 0 && x < DEFAULT_MAP_SIZE.width && 
          y >= 0 && y < DEFAULT_MAP_SIZE.height) {
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          // Najdi políčko na této pozici
          const tile = await ctx.db
            .query('map_tiles')
            .withIndex('by_position', (q) => q.eq('x', x).eq('y', y))
            .first();

          if (tile) {
            await ctx.db.patch(tile._id, {
              owner_id: ownerId,
              province_id: provinceId
            });
          }
        }
      }
    }
  }
}

// ============================================================
// POMOCNÉ QUERY PRO STATISTIKY
// ============================================================

export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const [players, alliances, provinces, mapTiles] = await Promise.all([
        ctx.db.query('players').collect(),
        ctx.db.query('alliances').collect(),
        ctx.db.query('provinces').collect(),
        ctx.db.query('map_tiles').collect()
      ]);

      return {
        success: true,
        data: {
          players: players.length,
          alliances: alliances.length,
          provinces: provinces.length,
          mapTiles: mapTiles.length,
          spawnZones: mapTiles.filter(t => t.is_spawn_zone).length,
          occupiedTiles: mapTiles.filter(t => t.owner_id).length
        }
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        success: false,
        error: 'Chyba při načítání statistik databáze'
      };
    }
  },
});

// ============================================================
// QUICK RESET MUTATION (pro development)
// ============================================================

export const quickReset = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('🚀 Spouštím rychlý reset...');
      
      await resetAllData(ctx);
      await initializeGameSettings(ctx);
      await generateGameMap(ctx);
      await createSampleData(ctx);
      
      console.log('✅ Rychlý reset dokončen!');
      
      return {
        success: true,
        message: 'Databáze byla resetována a znovu inicializována'
      };
    } catch (error) {
      console.error('❌ Chyba při rychlém resetu:', error);
      return {
        success: false,
        error: 'Chyba při resetování databáze'
      };
    }
  },
});

// ============================================================
// HEALTH CHECK
// ============================================================

export const healthCheck = query({
  args: {},
  handler: async (ctx) => {
    try {
      const stats = await ctx.runQuery(api.convex_setup.getDatabaseStats, {});
      
      const isHealthy = stats.success && 
                       stats.data.mapTiles > 0 && 
                       stats.data.spawnZones > 0;

      return {
        success: true,
        healthy: isHealthy,
        timestamp: Date.now(),
        stats: stats.data
      };
    } catch (error) {
      return {
        success: false,
        healthy: false,
        error: error.message
      };
    }
  },
});