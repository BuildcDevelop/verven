// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===== SVĚTY =====
  worlds: defineTable({
    name: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("preparing"), 
      v.literal("active"), 
      v.literal("paused"), 
      v.literal("ended")
    ),
    
    // Nastavení světa
    settings: v.object({
      speed: v.number(),
      unitSpeed: v.number(),
      maxPlayers: v.number(),
      barbarianSpawnChance: v.number(),
    }),
    
    // Mapa
    mapSizeX: v.number(),
    mapSizeY: v.number(),
    seed: v.optional(v.number()),
    
    // Statistiky
    currentPlayers: v.number(),
    totalVillages: v.number(),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_slug", ["slug"])
  .index("by_status", ["status"]),

  // ===== MAPA TILES =====
  mapTiles: defineTable({
    worldId: v.id("worlds"),
    x: v.number(),
    y: v.number(),
    terrainType: v.union(
      v.literal("plains"),
      v.literal("forest"), 
      v.literal("mountain"),
      v.literal("river"),
      v.literal("lake")
    ),
    
    // Vlastnictví (zatím prázdné, později pro vesnice)
    ownerId: v.optional(v.id("players")), // Pro budoucnost
    villageId: v.optional(v.string()),    // Pro budoucnost
    
    createdAt: v.number(),
  })
  .index("by_world", ["worldId"])
  .index("by_coordinates", ["worldId", "x", "y"])
  .index("by_terrain", ["terrainType"]),

  // ===== WORLD METADATA =====
  worldMetadata: defineTable({
    worldId: v.id("worlds"),
    generationTimeMs: v.number(),
    terrainStats: v.object({
      plains: v.number(),
      forest: v.number(), 
      mountain: v.number(),
      river: v.number(),
      lake: v.number(),
    }),
    generationSeed: v.number(),
    createdAt: v.number(),
  })
  .index("by_world", ["worldId"]),
});