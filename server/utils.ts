import { getLogger, LogLevel, LogLevels, LogRecord } from "@std/log";
import { sprintf } from "@std/fmt/printf";
import { blue, green, red, white, yellow } from "@std/fmt/colors";
import { ErrorDescriptor } from "./primitives.ts";

/**
 * Safe JSON parse
 * Returns a tuple with a flag for indicating success and the parsed value
 */
export function safeParse<T>(input: string): [true, T] | [false, string] {
  try {
    return [true, JSON.parse(input)];
  } catch (_) {
    return [false, input];
  }
}

/**
 * Log formatter
 * @param log
 */
export function formatter(log: LogRecord) {
  const applyColor = (str: string): string => {
    switch (log.level as LogLevel) {
      case LogLevels.INFO:
        return blue(str);
      case LogLevels.WARN:
        return yellow(str);
      case LogLevels.ERROR:
        return red(str);
      case LogLevels.DEBUG:
      default:
        return str;
    }
  };
  const now = new Date().toLocaleTimeString();
  const level = applyColor(`[${log.levelName}]`);
  const payload = (log.args && log.args.length > 0) ? JSON.stringify(log.args) : "";
  return `[${now}] ${level} ${green(log.msg)} ${white(payload)}`;
}

/**
 * Bail out
 * @param code
 * @param message
 * @param args
 */
export function bail([code, message]: ErrorDescriptor, ...args: unknown[]) {
  const logger = getLogger("dev-cache");
  logger.error(sprintf(message, ...args));
  logger.info("Check the documentation for more information: https://discoverorg.atlassian.net/wiki/x/kQCc7y4");
  logger.info("Exiting...");
  Deno.exit(code);
}

/**
 * Quick response
 * @param status
 * @param value
 */
export function respond(status: "error" | "ok", value: string): string {
  return JSON.stringify({ status, value });
}

/**
 * Quick error response
 * @param message
 * @param args
 */
export function erespond([, message]: ErrorDescriptor, ...args: unknown[]): string {
  getLogger("dev-cache").error(sprintf(message, ...args));
  return respond("error", sprintf(message, ...args));
}

/**
 * Safe check for socket existence
 * @param path
 */
export function safeIsSocket(path: string): boolean {
  try {
    return Deno.statSync(path).isSocket ?? false;
  } catch (_) {
    return false;
  }
}

/**
 * Safe remove directory
 * @param path
 */
export function safeRemoveSync(path: string): boolean {
  try {
    Deno.removeSync(path);
    return true;
  } catch (_) {
    return false;
  }
}
