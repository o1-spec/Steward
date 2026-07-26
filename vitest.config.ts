import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@steward/sdk": path.resolve(__dirname, "./packages/steward-sdk/src/index.ts"),
    },
  },
});
