import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  outDir: "build",
  clean: true,
  external: ["@gueranger/core"],
});
