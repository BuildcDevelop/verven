import { mutation, query } from "./_generated/server";

export const addVillage = mutation(async ({ db }, args) => {
  // Vrátí všechny záznamy z kolekce "villages"
  return await db.query("villages").collect();
});
