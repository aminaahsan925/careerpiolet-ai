// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const loadedEnv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
for (const [key, value] of Object.entries(loadedEnv)) {
  if (!(key in process.env)) process.env[key] = value;
}

// Use "node-server" preset for deployment on any VPS / cloud (Alibaba ECS, etc.)
// Switch to "vercel" or "cloudflare" for those specific platforms.
const DEPLOY_TARGET = process.env["DEPLOY_TARGET"] || "vercel";

const nitroConfig: Record<string, unknown> = {
  preset: DEPLOY_TARGET,
  externals: {
    inline: ["tslib"],
  },
  rollupConfig: {
    output: { inlineDynamicImports: true },
  },
};

if (DEPLOY_TARGET === "vercel") {
  nitroConfig["vercel"] = { functions: { runtime: "nodejs22.x" } };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Vercel must receive a Vercel function, not the default Cloudflare bundle.
  nitro: nitroConfig,
  vite: {
    build: {
      chunkSizeWarningLimit: 5000,
    },
  },
});
