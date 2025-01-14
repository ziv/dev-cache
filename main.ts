import { type Args, parseArgs } from "@std/cli/parse-args";
import { ConsoleHandler, getLogger, setup } from "@std/log";
import create from "@xpr/jsocket/server";
import initDevCache, { type WritePayload } from "./server/cache.ts";
import Help from "./server/help.ts";
import { CacheKeyStrategies, Errors, HOUR, type Incoming, SOCKET } from "./server/primitives.ts";
import { bail, erespond, formatter, respond, safeIsSocket, safeParse, safeRemoveSync } from "./server/utils.ts";

if (import.meta.main) {
  // setup logger
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
  let connection = 0;

  create(SOCKET, async (buf: string) => {
    connection++;
    const [parsed, incoming] = safeParse<Incoming<WritePayload>>(buf);
    if (!parsed) {
      return erespond(Errors.ErrorParsingRequest, connection);
    }
    logger.debug("incoming request", connection);
    switch (incoming.action) {
      case "status":
        return respond("ok", "server is up and running");
      case "read":
        try {
          return respond("ok", await cache.read(incoming.payload));
        } catch (err) {
          return erespond(Errors.ErrorReadingCache, `${err}`, connection);
        }
      case "write":
        try {
          await cache.write(incoming.payload);
          return respond("ok", "data saved");
        } catch (err) {
          return erespond(Errors.ErrorWritingCache, `${err}`, connection);
        }
    }
    return erespond(Errors.UnrecognizedRequest, connection);
  });
  console.log("Press CTRL+C to exit");
}
