import { query, mutation } from "./_generated/server";

export const getGameState = query(async (ctx, args) => {
  // Tady normálně vrátíš data ze storage (např. db).
  return { success: true, data: { example: "game state" } };
});

export const createProvince = mutation(async (ctx, args: { name: string; ownerId: string; centerX: number; centerY: number }) => {
  // Dummy výsledek, implementaci si pak doplníš.
  return { success: true, data: { name: args.name, x: args.centerX, y: args.centerY } };
});

export const getPlayerById = query(async (ctx, args: { playerId: string }) => {
  return { success: true, data: { id: args.playerId, name: "Player Example" } };
});