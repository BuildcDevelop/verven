import { mutation, query } from "./_generated/server";

export const addVillage = mutation(async ({ db }, args) => {
  // kód pouze pro server (ne z frontendu)
});
// Tvoje logika tady
// Např.:
// return await db.insert("villages", { ...args });