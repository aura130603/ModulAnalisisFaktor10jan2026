import path from 'path';

// Centralized config with sensible defaults; env can override where useful.
export const PORT: number = Number(process.env.PORT || 5000);

export const MAX_UPLOAD_SIZE_MB: number = Number(process.env.MAX_UPLOAD_SIZE_MB || '10');

// TEMP dir resolver; supports tests and env overrides.
// At runtime __dirname is dist/config; ../temp resolves to dist/temp
export const getTempDir = (): string =>
  process.env.TEMP_DIR
    ? path.resolve(process.env.TEMP_DIR)
    : path.join(__dirname, '../temp');

// Boolean env-flag parser (accepts: 1, true, yes, on; case-insensitive)
const isTruthy = (val?: string): boolean => /^(1|true|yes|on)$/i.test(val ?? '');

// Global rate limiting toggle: enabled by default unless explicitly disabled via env
export const RATE_LIMIT_ENABLED: boolean =
  process.env.RATE_LIMIT_ENABLED !== undefined
    ? isTruthy(process.env.RATE_LIMIT_ENABLED)
    : true;

export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
export const RATE_LIMIT_MAX = 100; // max per key per window
