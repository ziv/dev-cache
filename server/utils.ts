import { LogLevels, LogRecord } from "@std/log";
import { sprintf } from "@std/fmt/printf";
import { blue, green, red, white, yellow } from "@std/fmt/colors";

/**
 * Log formatter
 * @param log
 */
export function formatter(log: LogRecord) {
  const Levels: Record<number, (str: string) => string> = {
    [LogLevels.INFO]: blue,
    [LogLevels.WARN]: yellow,
    [LogLevels.ERROR]: red,
  };
  return sprintf(
    "[%s] %s %s %s",
    new Date().toLocaleTimeString(),
    Levels[log.level]?.(`[${log.levelName}]`) ?? `[${log.levelName}]`,
    green(log.msg),
    white((log.args && log.args.length > 0) ? JSON.stringify(log.args) : ""),
  );
}

/**
 * Safe check for socket existence
 * @param path
 */
export function safeIsSocket(path: string): boolean {
  try {
    return Deno.statSync(path).isSocket ?? Deno.statSync(path).isFile ?? false;
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
