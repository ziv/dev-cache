/**
 * Generate a unique key for a given sid.
 *
 * @example usage:
 * ```ts
 * import unique from "@xpr/dev-cache/unique";
 *
 * const key0 = unique("my-sid"); // 40 char length hash
 * const key1 = unique("my-sid");
 * const key2 = unique("my-sid", "my-name");
 *
 * assert(key0 === key1);
 * ```
 *
 * @module
 */
import { hash } from 'node:crypto';

/**
 * Generate a unique key for a given sid.
 *
 * @param sid input can distinguish the cache
 */
export default function unique(sid: unknown): string;
/**
 * Generate a unique key for a given sid and name.
 *
 * @param sid input can distinguish the cache
 * @param name name to distinguish the cache
 */
export default function unique(sid: unknown, name: string): string;
/** @internal runtime signature */
export default function unique(sid: unknown, name = 'default') {
    return hash('sha1', JSON.stringify({name, sid}));
}
