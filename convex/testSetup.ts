// convex/testSetup.ts - Pro rychlé testování
import { mutation } from "./_generated/server"; // ✅ PŘIDAT IMPORT
import { v } from "convex/values";

export const createTestWorlds = mutation({
  handler: async (ctx) => {
    const testWorlds = [
      {
        name: "Hlavní server",
        mapSize: { width: 1000, height: 1000 },
        settings: { speed: 1.0, unitSpeed: 1.0, maxPlayers: 500, barbarianSpawnChance: 100 }
      },
      {
        name: "Rychlý svět", 
        mapSize: { width: 500, height: 500 },
        settings: { speed: 5.0, unitSpeed: 2.0, maxPlayers: 100, barbarianSpawnChance: 80 }
      },
      {
        name: "Test svět",
        mapSize: { width: 300, height: 300 },
        settings: { speed: 10.0, unitSpeed: 5.0, maxPlayers: 50, barbarianSpawnChance: 50 }
      }
    ];
    
    const results = [];
    
    for (const worldData of testWorlds) {
      try {
        const result = await ctx.runMutation(api.worlds.createWorld, worldData);
        results.push({ success: true, world: worldData.name, result });
      } catch (error) {
        results.push({ success: false, world: worldData.name, error: error.message });
      }
    }
    
    return {
      message: "Test světy vytvořeny",
      results,
      totalCreated: results.filter(r => r.success).length
    };
  },
});
