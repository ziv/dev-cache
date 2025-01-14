import process from "node:process";
import { existsSync } from "node:fs";
import client from "@xpr/jsocket/client";
import type { WritePayload } from "../server/cache.ts";

const SOCKET_PATH = `${process.env.TMPDIR}/dev-cache.sock`;
type Reply<T> = { status: string; value: T };
type RequestFunction = (action: string, payload?: unknown) => Promise<string>;
type ExistsFunction = (path: string) => boolean;

/**
 * Wraps a generator function with a cache.
 */
export default async function wrap<T = unknown>(
  appid: string,
  name: string,
  generator: () => Promise<T>,
  ttl = -1,
  request = client as unknown as RequestFunction,
  exists = existsSync as ExistsFunction,
): Promise<T> {
  // is it a development environment?
  if (
    process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "dev"
  ) {
    return generator();
  }
  // is socket available?
  if (!exists(SOCKET_PATH)) {
    return generator();
  }
  // the request method
  const req = async <T, P = unknown>(
    action: string,
    payload?: P,
  ): Promise<Reply<T>> => {
    const res = await request(
      SOCKET_PATH,
      JSON.stringify({ action, payload }),
    );
    return JSON.parse(res) as Reply<T>;
  };
  // is server available?
  const reply = await req<undefined>("status").catch(() => ({
    status: "error",
  }));
  if (reply.status !== "ok") {
    return generator();
  }
  // make the read request
  const res = await req<undefined>("read", {
    appid,
    name,
    ppid: process.ppid ?? -1,
  });
  // hit cache
  if (res.status === "ok") {
    return res.value as T;
  }
  // miss cache
  const value = await generator(); // do not try/catches here, let the caller handle it
  // writes results to cache
  await req<undefined, WritePayload<T>>("write", {
    appid,
    name,
    ppid: process.ppid ?? -1,
    value,
    ttl,
  });
  return value;
}
