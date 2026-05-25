import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention) so DATABASE_URL is picked up
// for local `prisma db push`/`db:generate`. Falls back to .env for parity
// with platforms that use the conventional dotenv file. On Railway, real
// env vars are set directly, so these no-ops are harmless.
config({ path: '.env.local' });
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Railway provides this automatically from the PostgreSQL plugin
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder',
  },
});
