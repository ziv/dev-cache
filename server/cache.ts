import { decodeBase64, encodeBase64 } from "@std/encoding/base64";

const ALG = "AES-GCM";
const KEY_LENGTH = 256;

/** Input identifiers for cache keys **/
export type KeyIdentifiers = { appid: string; ppid: string; name: string };

/** Convert input to Deno.KvKey */
export type CacheKeyStrategy = (keys: KeyIdentifiers) => Deno.KvKey;

/** Cached item structure */
type CachedItem = {
  /** Identification */
  // name: string;

  /** Cache value */
  value: ArrayBuffer;

  /** Item initialization vector */
  iv: string;

  /** Timer resource ID */
  timer: number;

  /** Expiration time */
  eat: number;
};

export type WritePayload = KeyIdentifiers & {
  /** Cache value */
  value: string;

  /** Time to live, must be equal or less than `this.ttl` if `-1` use `this.ttl`. `0` is valid ttl. */
  ttl: number;
};

export type DevCacheOptions = {
  /** AES key to encrypt/decrypt cache values */
  key: CryptoKey;

  /** Key-value store instance */
  kv: Deno.Kv;

  /** Time to live in milliseconds */
  ttl: number;

  /** Cache key strategy, how to convert input to a key */
  cacheKeyStrategy: CacheKeyStrategy;
};

/** s
 * Check if the value is a CachedItem
 * @param value
 */
const isCacheValue = (value: unknown): value is CachedItem => !!value && "value" in (value as object);

/**
 * Cache key strategies map
 *
 * - none: identify cache only by its name
 * - appid: identify cache by appid and name, useful for multiple apps, default strategy
 * - watch: identify cache by appid, name, and parent pid, useful for watching a process
 */
const keyStrategy: { [key: string]: CacheKeyStrategy } = {
  none: ({ name }: KeyIdentifiers) => [name],
  appid: ({ appid, name }: KeyIdentifiers) => [appid, name],
  watch: ({ appid, ppid, name }: KeyIdentifiers) => [ppid, appid, name],
};

export class DevCacheDb {
  readonly #key: CryptoKey;
  readonly #kv: Deno.Kv;
  readonly #ttl: number;
  readonly #cacheKey: CacheKeyStrategy;

  constructor(options: DevCacheOptions) {
    this.#key = options.key;
    this.#kv = options.kv;
    this.#ttl = options.ttl;
    this.#cacheKey = options.cacheKeyStrategy;
  }

  /**
   * Remove cache item
   * @param items
   */
  async remove(items: KeyIdentifiers): Promise<boolean> {
    const cacheKey = this.#cacheKey(items);
    const maybeItem = await this.#kv.get<CachedItem>(cacheKey);
    isCacheValue(maybeItem.value) && clearTimeout(maybeItem.value.timer);
    await this.#kv.delete(cacheKey);
    return true;
  }

  /**
   * Read cache item
   * @param ids
   */
  async read(ids: KeyIdentifiers): Promise<string> {
    const maybeItem = await this.#kv.get<CachedItem>(this.#cacheKey(ids));
    if (!isCacheValue(maybeItem.value)) {
      throw new Error("not found");
    }
    if (maybeItem.value.eat < Date.now()) {
      await this.remove(ids);
      throw new Error("expired");
    }
    const decrypted = await crypto.subtle.decrypt(
      { name: ALG, iv: decodeBase64(maybeItem.value.iv) },
      this.#key,
      maybeItem.value.value as Uint8Array,
    );
    return new TextDecoder().decode(decrypted);
  }

  /**
   * Write cache item
   * @param ids
   * @param value
   * @param ttl
   */
  async write({ value, ttl, ...ids }: WritePayload): Promise<boolean> {
    if (ttl < -1 || ttl > this.#ttl) {
      throw new Error(`invalid ttl ${ttl}`);
    }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: ALG, iv },
      this.#key,
      new TextEncoder().encode(value),
    );
    const useTtl = ttl === -1 ? this.#ttl : ttl;
    await this.#kv.set(this.#cacheKey(ids), {
      iv: encodeBase64(iv),
      eat: Date.now() + useTtl,
      value: encrypted,
      timer: setTimeout(this.remove.bind(this), useTtl, ids),
    });
    return true;
  }
}

/**
 * Create a new DevCacheDb instance
 *
 * @param ttl
 * @param cacheKeyStrategy
 */
export default async function initDevCache(ttl: number, cacheKeyStrategy: keyof typeof keyStrategy) {
  /**
   * Start "in memory" key-value store
   *
   * `Deno.openKv()` without connection string to remote storage, create a local sqlite file,
   * and we don't want to save sensitive data to filesystem.
   * The `:memory:` option creates an in-memory database usually used for testing.
   *
   * We could use a simple Map instead of Deno.Kv, but Deno.Kv has a TTL feature, great keys mechanism,
   * and it's more fun.
   */
  const kv = await Deno.openKv(":memory:");
  const key = await crypto.subtle.generateKey(
    { name: ALG, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
  return new DevCacheDb({ key, kv, ttl, cacheKeyStrategy: keyStrategy[cacheKeyStrategy] });
}
