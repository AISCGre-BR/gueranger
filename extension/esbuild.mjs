import * as esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",
  external: ["vscode"],
  minify: production,
  sourcemap: !production,
  target: "node22",
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
  entryPoints: ["src/webview/main.ts"],
  bundle: true,
  outfile: "dist/webview.js",
  platform: "browser",
  format: "iife",
  minify: production,
  sourcemap: !production,
};

async function build() {
  if (watch) {
    const extCtx = await esbuild.context(extensionConfig);
    // Only watch webview if the entry point exists
    const fs = await import("node:fs");
    if (fs.existsSync("src/webview/main.ts")) {
      const webCtx = await esbuild.context(webviewConfig);
      await Promise.all([extCtx.watch(), webCtx.watch()]);
    } else {
      await extCtx.watch();
    }
    console.log("Watching for changes...");
  } else {
    await esbuild.build(extensionConfig);
    console.log("Extension host built: dist/extension.js");

    // Only build webview if the entry point exists
    const fs = await import("node:fs");
    if (fs.existsSync("src/webview/main.ts")) {
      await esbuild.build(webviewConfig);
      console.log("WebView built: dist/webview.js");
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
