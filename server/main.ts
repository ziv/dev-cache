import { type Args, parseArgs } from "@std/cli/parse-args";
import { ConsoleHandler, getLogger, setup } from "@std/log";
import { sprintf } from "@std/fmt/printf";
import create from "@xpr/jsocket/server";
import initDevCache, { type WritePayload } from "./cache.ts";
import Help from "./help.ts";
import { CacheKeyStrategies, type ErrorDescriptor, Errors, HOUR, type Incoming, SOCKET } from "./primitives.ts";
import { formatter, safeIsSocket, safeRemoveSync } from "./utils.ts";

if (import.meta.main) {
  /** Bail out */
  const bail = ([code, message]: ErrorDescriptor, ...args: unknown[]) => {
    const logger = getLogger("dev-cache");
    logger.error(sprintf(message, ...args));
    logger.info("Check the documentation for more information: https://discoverorg.atlassian.net/wiki/x/kQCc7y4");
    logger.info("Exiting...");
    Deno.exit(code);
  };

  /** Logger setup */
  setup({
    handlers: { console: new ConsoleHandler("DEBUG", { formatter, useColors: false }) },
    loggers: { "dev-cache": { level: "DEBUG", handlers: ["console"] } },
  });
  const logger = getLogger("dev-cache");

  // input
  const args = parseArgs(Deno.args, {
    alias: {
      help: "h",
      ttl: "t",
      cacheKeyStrategy: "s",
    },
    default: {
      help: false,
      ttl: HOUR,
      cacheKeyStrategy: "appid",
    },
  }) as Args;

  if (args.help) {
    console.log(Help);
    Deno.exit(0);
  }

  // normalize options
  // -----------------

  const ttl = args.ttl * 1000;
  if (ttl < 0) bail(Errors.NegativeTtl, ttl);
  if (ttl > HOUR * 2 * 1000) bail(Errors.TooLongTtl, ttl);
  logger.info("ttl set to", ttl);

  const cacheKeyStrategy = args.cacheKeyStrategy;
  if (!CacheKeyStrategies.includes(cacheKeyStrategy)) bail(Errors.InvalidCacheKeyStrategy, cacheKeyStrategy);
  logger.info("cache key strategy", cacheKeyStrategy);

  const cache = await initDevCache(ttl, cacheKeyStrategy);
  logger.info("dev-cache key-value server started");

  // create server
  // -------------

  logger.debug("creating unix socket server");
  if (safeIsSocket(SOCKET)) {
    logger.debug("socket already exists, removing");
    if (!safeRemoveSync(SOCKET)) bail(Errors.FailedToRemoveSocket);
  }

  /** Match incoming request */
  const isIncoming = (e: unknown): e is Incoming<WritePayload> => !!e && "action" in (e as Incoming);

  /** Ok response */
  const ok = (value: string) => ({ status: "ok", value });

  /** Error response */
  const error = (value: string, connection: number) => {
    getLogger("dev-cache").error(value, connection);
    return { status: "error", value };
  };

  /** Connection counter (debug) */
  let connection = 0;
  create(SOCKET, async (input) => {
    connection++;
    if (!isIncoming(input)) {
      return error(Errors.ErrorParsingRequest[1], connection);
    }
    logger.debug("incoming request", connection);
    switch (input.action) {
      case "status":
        return ok("server is up and running");
      case "read":
        try {
          return ok(await cache.read(input.payload));
        } catch (err) {
          return error(sprintf(Errors.ErrorReadingCache[1], err), connection);
        }
      case "write":
        try {
          await cache.write(input.payload);
          return ok("data saved");
        } catch (err) {
          return error(sprintf(Errors.ErrorWritingCache[1], err), connection);
        }
    }
    return error(Errors.UnrecognizedRequest[1], connection);
  });
  console.log("Press CTRL+C to exit");
}
