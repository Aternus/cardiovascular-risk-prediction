/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as intake from "../intake.js";
import type * as numbers from "../numbers.js";
import type * as patients from "../patients.js";
import type * as validators_form from "../validators/form.js";
import type * as validators_intake from "../validators/intake.js";
import type * as validators_patients from "../validators/patients.js";
import type * as validators_types from "../validators/types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  intake: typeof intake;
  numbers: typeof numbers;
  patients: typeof patients;
  "validators/form": typeof validators_form;
  "validators/intake": typeof validators_intake;
  "validators/patients": typeof validators_patients;
  "validators/types": typeof validators_types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
