/**
 * dev-cache client function
 *
 * It takes a generator function and wraps it
 * with a cache in development environment only.
 *
 * @example usage:
 * ```ts
 * import wrap from "@xpr/devcache";
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
 * import wrap from "@xpr/devcache";
 * import appId from "@xpr/devcache/appid";
 * import unique from "@xpr/devcache/unique";
 *
 * const input = { ... };
 *
 * // the original expensive call:
 * // const results = await veryExpensiveFunction(input);
 *
 * // replaced with:
 * const result = await wrap(
 *      // (1) application identifier, can be set globally using environment variable `DEVCACHE_APPID`
 *      appId("my-app"),
 *      // (2) `unique` takes the generator input and provides a unique identifier for the cache key
 *      unique(input, "secrets"),
 *      // (3) generator function
 *      () => veryExpensiveFunction(input),
 *      // (4) optional ttl
 *      60 * 10, // 10 minutes
 * );
 * ```
 *
 * @module
 */
import process from 'node:process';
import { existsSync } from 'node:fs';
import client from '@xpr/jsocket/client';

/** Input identifiers for cache keys **/
type KeyIdentifiers = { appid: string; ppid: number; name: string };

/** Saving cache payload */
type WritePayload<V> = KeyIdentifiers & { value: V; ttl: number };

/** Server reply structure. Status can be 'ok' or 'error' */
type Reply<T = unknown> = { status: string; value: T };

/**
 * Wraps a generator function with a cache.
 * @param appid
 * @param name
 * @param generator
 */
export default async function wrap<T = unknown>(appid: string, name: string, generator: () => Promise<T>): Promise<T>;
/**
 * Wraps a generator function with a cache and custom ttl.
 * @param appid
 * @param name
 * @param generator
 * @param ttl
 */
export default async function wrap<T = unknown>(appid: string, name: string, generator: () => Promise<T>, ttl: number): Promise<T>;
/** @internal runtime signature contain dependencies. */
export default async function wrap<T = unknown>(
    appid: string,
    name: string,
    generator: () => Promise<T>,
    ttl = -1,
    // dependencies, do not use directly
    req = client as unknown as <T>(action: string, payload?: unknown) => Promise<T>,
    exists = existsSync as (path: string) => boolean,
): Promise<T> {
    // is it a development environment?
    if (
        process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'dev'
    ) {
        return generator();
    }
    const SOCKET_PATH = process.env.DEVCACHE_SOCKET ?? `${process.env.TMPDIR}/dev-cache.sock`;
    // is socket available?
    if (!exists(SOCKET_PATH)) {
        return generator();
    }
    // the request method
    const request = <T = unknown>(action: string, payload?: unknown): Promise<Reply<T>> => req(SOCKET_PATH, {
        action,
        payload,
    });
    // is server available?
    const statusReply = await request('status').catch(() => ({status: 'error'} as Reply));
    if (statusReply.status !== 'ok') {
        return generator();
    }
    // make the read request
    const readReply = await request<KeyIdentifiers>('read', {
        appid,
        name,
        ppid: process.ppid ?? -1,
    });
    // hit cache
    if (readReply.status === 'ok') {
        return readReply.value as T;
    }
    // miss cache
    const value = await generator(); // do not try/catches here, let the caller handle it
    // writes results to cache
    await request<WritePayload<T>>('write', {
        appid,
        name,
        ppid: process.ppid ?? -1,
        value,
        ttl,
    });
    return value;
}
