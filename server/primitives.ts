// App types
// import { KeyIdentifiers } from "./cache.ts";

/**
 * Incoming request structure.
 */
export type Incoming<T = unknown> = {
  /**
   * Action to be invoked.
   */
  action: string;

  /**
   * Payload to be passed to the action.
   */
  payload: T;
};

// App Constants
export const HOUR = 60 * 60;
export const CacheKeyStrategies = ["watch", "appid", "none"] as const;
export const SOCKET = `${Deno.env.get("TMPDIR")}/dev-cache.sock`;

/**
 * Errors ([code, message])
 * Errors codes below 100 are fatal and cause the server to bail out.
 */

export type ErrorDescriptor = [number, string];
export type FatalErrors =
  | "NegativeTtl"
  | "TooLongTtl"
  | "InvalidCacheKeyStrategy"
  | "FailedToRemoveSocket";

export type WarningErrors =
  | "ErrorParsingRequest"
  | "ErrorReadingCache"
  | "ErrorWritingCache"
  | "UnrecognizedRequest";

export const Errors: Record<FatalErrors | WarningErrors, ErrorDescriptor> = {
  NegativeTtl: [1, "ttl must be greater than 0. got %s"],
  TooLongTtl: [2, "ttl must be less than 7200 (2 hours). got %s"],
  InvalidCacheKeyStrategy: [3, "invalid cache key strategy. got %s"],
  FailedToRemoveSocket: [4, "failed to remove socket"],
  ErrorParsingRequest: [101, "error parsing request"],
  ErrorReadingCache: [102, "error reading cache: %s"],
  ErrorWritingCache: [103, "error writing cache: %s"],
  UnrecognizedRequest: [104, "unrecognized request"],
};
