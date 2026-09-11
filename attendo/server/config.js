import 'dotenv/config';

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export function assertRuntimeConfig({ requireDatabase = true } = {}) {
  if (requireDatabase && (!config.databaseUrl || config.databaseUrl === 'your_neon_database_url')) {
    throw new Error('DATABASE_URL is not configured. Add your Neon connection string to .env.');
  }
  if (!config.jwtSecret || config.jwtSecret === 'your_jwt_secret') {
    throw new Error('JWT_SECRET is not configured. Set a long random secret in .env.');
  }
}
