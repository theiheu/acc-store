// Simple environment-aware logger
// Usage: import { logger } from "@/src/utils/logger";
// logger.debug("message", data)

const isProd = process.env.NODE_ENV === "production";

function fmt(level: string, args: any[]) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}]`, ...args];
}

export const logger = {
  debug: (...args: any[]) => {
    if (!isProd) console.debug(...fmt("DEBUG", args));
  },
  info: (...args: any[]) => console.info(...fmt("INFO", args)),
  warn: (...args: any[]) => console.warn(...fmt("WARN", args)),
  error: (...args: any[]) => console.error(...fmt("ERROR", args)),
};

