/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addVillage from "../addVillage.js";
import type * as client from "../client.js";
import type * as convex_api from "../convex_api.js";
import type * as convex_setup from "../convex_setup.js";
import type * as getVillages from "../getVillages.js";
import type * as mapGenerator from "../mapGenerator.js";
import type * as tasks from "../tasks.js";
import type * as testSetup from "../testSetup.js";
import type * as worlds from "../worlds.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addVillage: typeof addVillage;
  client: typeof client;
  convex_api: typeof convex_api;
  convex_setup: typeof convex_setup;
  getVillages: typeof getVillages;
  mapGenerator: typeof mapGenerator;
  tasks: typeof tasks;
  testSetup: typeof testSetup;
  worlds: typeof worlds;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
