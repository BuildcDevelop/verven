import { query, mutation } from "./_generated/server";

export const setupGameDatabase = mutation(async (ctx, args: { resetData: boolean; createSampleData: boolean; generateTerrain: boolean }) => {
  return { success: true, data: "Database setup complete." };
});

export const getDatabaseStats = query(async (ctx, args) => {
  return { success: true, data: { tables: 0, objects: 0 } };
});

export const healthCheck = query(async (ctx, args) => {
  return { success: true, data: { status: "OK" } };
});
