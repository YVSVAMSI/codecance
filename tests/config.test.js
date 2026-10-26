import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config.js requireEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns value when environment variable exists in development mode', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_VAR = 'development-val';
    const { requireEnv } = await import('../server/config.js');
    expect(requireEnv('TEST_VAR')).toBe('development-val');
  });

  it('returns undefined when environment variable is missing in development mode without throwing', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MISSING_DEV_VAR;
    const { requireEnv } = await import('../server/config.js');
    expect(requireEnv('MISSING_DEV_VAR')).toBeUndefined();
  });

  it('returns value when environment variable exists in production mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'dummy-long-secret-key-32-chars-long';
    process.env.REQUIRED_PROD_VAR = 'secure-key';
    const { requireEnv } = await import('../server/config.js');
    expect(requireEnv('REQUIRED_PROD_VAR')).toBe('secure-key');
  });

  it('throws an error when required variable is missing in production mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'dummy-long-secret-key-32-chars-long';
    const { requireEnv } = await import('../server/config.js');
    expect(() => requireEnv('NON_EXISTENT_PROD_SECRET')).toThrow(
      'Missing required environment variable: NON_EXISTENT_PROD_SECRET'
    );
  });
});
