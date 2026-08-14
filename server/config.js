import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export function requireEnv(name) {
  const value = process.env[name];
  if (isProd && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  isProd,
  port: Number(process.env.PORT || (isProd ? 8080 : 5050)),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  cookieName: process.env.COOKIE_NAME || 'dsa_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProd,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  },
  otp: {
    ttlMs: Number(process.env.OTP_TTL_MS || 15 * 60 * 1000), // 15 min
    resendCooldownMs: Number(process.env.OTP_RESEND_COOLDOWN_MS || 60_000),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    maxResends: Number(process.env.OTP_MAX_RESENDS || 5),
  },
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'CodeCance <onboarding@resend.dev>',
};
