import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    plugins: [
      // Bundle all npm deps into the main process JS so the packaged
      // app has zero missing dependency issues on any platform
      externalizeDepsPlugin({
        exclude: [
          "@gueranger/core",
          "google-auth-library",
          "@googleapis/sheets",
          "@googleapis/drive",
          "electron-conf",
          "bottleneck",
          "cheerio",
          "p-retry",
          "fast-xml-parser",
          "gaxios",
          "gcp-metadata",
          "gtoken",
          "jws",
          "googleapis-common",
        ],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react(), tailwindcss()],
  },
});
