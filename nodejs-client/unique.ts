import { hash } from 'node:crypto';

/**
 * Generate a unique key for the given value
 * @param sid input can distinguish the cache
 */
export default function unique(sid: unknown) {
    return hash('sha1', JSON.stringify(sid));
}
