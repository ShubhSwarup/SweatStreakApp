/**
 * Structured logger — always on in dev, silent in production.
 *
 * Usage:
 *   import { log } from '../utils/logger';
 *   log.info('SessionStore', 'fetchActiveSession', { id });
 *   log.error('API', 'startSession', err, { payload });
 *
 * Every log line is prefixed with a timestamp and tag so you can
 * grep the Metro console by module name, e.g. grep "SessionStore"
 */

const IS_DEV = __DEV__;

type Level = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m', // grey
  info:  '\x1b[36m', // cyan
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function ts(): string {
  return new Date().toISOString().substring(11, 23); // HH:mm:ss.mmm
}

function emit(level: Level, module: string, action: string, extra?: unknown, err?: unknown) {
  if (!IS_DEV && level === 'debug') return;

  const tag = `[${ts()}] [${level.toUpperCase()}] [${module}] ${action}`;
  const color = COLORS[level];

  if (level === 'error') {
    // Always use console.error for errors so React Native's error overlay catches them
    console.error(`${color}${tag}${RESET}`, ...(extra !== undefined ? [extra] : []), ...(err !== undefined ? [err] : []));
  } else if (level === 'warn') {
    console.warn(`${color}${tag}${RESET}`, ...(extra !== undefined ? [extra] : []));
  } else {
    if (IS_DEV) {
      console.log(`${color}${tag}${RESET}`, ...(extra !== undefined ? [extra] : []));
    }
  }
}

export const log = {
  debug: (module: string, action: string, extra?: unknown) =>
    emit('debug', module, action, extra),

  info: (module: string, action: string, extra?: unknown) =>
    emit('info', module, action, extra),

  warn: (module: string, action: string, extra?: unknown) =>
    emit('warn', module, action, extra),

  error: (module: string, action: string, err: unknown, extra?: unknown) =>
    emit('error', module, action, extra, err),
};

/**
 * Format an Axios error into a readable summary for logging.
 */
export function formatAxiosError(err: any): string {
  if (!err) return 'unknown error';
  const status = err?.response?.status;
  const url = err?.config?.url ?? '?';
  const method = (err?.config?.method ?? '?').toUpperCase();
  const message = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'unknown';
  return `${method} ${url} → ${status ?? 'NETWORK_ERROR'}: ${message}`;
}
