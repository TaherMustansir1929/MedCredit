import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

export default defineConfig({
  out: path.resolve(__dirname, './drizzle').replace(/\\/g, '/'),
  schema: path.resolve(__dirname, './src/schema.ts').replace(/\\/g, '/'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
