import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // Error "reading 'config'" berasal dari cache Vite (node_modules/.vite)
    // yang korup saat ada operasi file berat bersamaan (build/dev/lint).
    // Pool forks + non-parallel mengisolasi worker; nonaktifkan optimizer deps
    // agar tak menulis cache yang bisa korup untuk suite kecil ini.
    pool: "forks",
    fileParallelism: false,
    deps: { optimizer: { ssr: { enabled: false }, web: { enabled: false } } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
