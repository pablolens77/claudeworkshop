import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses PgBouncer pooler)
    // Use DATABASE_URL (pooler) in the app via PrismaPg adapter
    // Use DIRECT_URL for migrations (bypasses PgBouncer pooler)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
