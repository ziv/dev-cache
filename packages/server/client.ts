/**
 * dev-cache client function
 *
 * It takes a generator function and wraps it
 * with a cache in development environment only.
 *
 * @example usage:
 * ```ts
 * import wrap from "@xpr/dev-cache";
 *
 * function veryExpensiveFunction(): Promise<unknown> {
 * }
 *
 * const result = await wrap("my-app",
 *    "my-expensive-function",
 *    () => veryExpensiveFunction()
 * );
 * ```
 *
 * @example full usage:
 * ```ts
 * import wrap from "@xpr/dev-cache";
 * import appId from "@xpr/dev-cache/appid";
 * import unique from "@xpr/dev-cache/unique";
 *
 * // const input = { ... };
 * // const results = await veryExpensiveFunction(input);
 *
 * const result = await wrap(appId("my-app"), unique(input), () => veryExpensiveFunction(input));
 * ```
 *
 * @module
 */
import client from "@xpr/jsocket/client";
import { safeIsSocket } from "./utils.ts";

type Gen<T> = () => Promise<T>;

/** Input identifiers for cache keys **/
type KeyIdentifiers = { appid: string; ppid: number; name: string };

/** Saving cache payload */
type WritePayload<V> = KeyIdentifiers & { value: V; ttl: number };

/** Server reply structure. Status can be 'ok' or 'error' */
type Reply<T = unknown> = { status: string; value: T };

/**
 * Wraps a generator function with a cache.
 */
export default async function wrap<T = unknown>(appid: string, name: string, generator: Gen<T>): Promise<T>;
export default async function wrap<T = unknown>(appid: string, name: string, generator: Gen<T>, ttl: number): Promise<T>;
/** Run time signature contain dependencies. */
export default async function wrap<T = unknown>(
  appid: string,
  name: string,
  generator: Gen<T>,
  ttl = -1,
  // dependencies, do not use directly
  req = client as unknown as <T>(action: string, payload?: unknown) => Promise<T>,
  exists = safeIsSocket as (path: string) => boolean,
  env = Deno.env.get("NODE_ENV"),
  socketPath = Deno.env.get("DEVCACHE_SOCKET") ?? `${Deno.env.get("TMPDIR")}/dev-cache.sock`,
): Promise<T> {
  // is it a development environment?
  if (env !== "development" && env !== "dev") {
    return generator();
  }
  // is socket available?
  if (!exists(socketPath)) {
    return generator();
  }
  // the request method
  const request = <T = unknown>(action: string, payload?: unknown): Promise<Reply<T>> =>
    (req(socketPath, { action, payload }) as Promise<Reply<T>>)
      .catch(() => ({ status: "error" }) as Reply<T>);

  const statusReply = await request("status");
  if (statusReply.status !== "ok") { // is server available?
    return generator();
  }
  const key = { appid, name, ppid: Deno.ppid ?? -1 };
  const readReply = await request<KeyIdentifiers>("read", key);
  if (readReply.status === "ok") { // hit cache
    return readReply.value as T;
  } // miss cache
  const value = await generator(); // do not try/catches here, let the caller handle it
  await request<WritePayload<T>>("write", { ...key, value, ttl });
  return value;
}
