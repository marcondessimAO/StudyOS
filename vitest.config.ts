import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    passWithNoTests: true,
    env: { APP_TZ: "America/Sao_Paulo" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // db.ts só cria o PrismaClient; não há lógica para testar.
      exclude: ["src/lib/**/*.test.ts", "src/lib/db.ts"],
      reporter: ["text", "html"],
    },
  },
});
