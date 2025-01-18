/**
 * Get the application identifier.
 *
 * Prefer the environment value over given one.
 * Environment variable: `DEVCACHE_APPID`
 *
 * @example usage:
 * ```ts
 * import appid from "@xpr/dev-cache/appid";
 * // Env: DEVCACHE_APPID=my-app
 *
 * const id = appid("frodo");
 * assert(id === "my-app");
 * ```
 *
 * @module
 */
import process from "node:process";

/**
 * Get the application identifier
 * @param value fallback application id
 */
export default function appid(value: string) {
  return process.env.DEVCACHE_APPID ?? value;
}
