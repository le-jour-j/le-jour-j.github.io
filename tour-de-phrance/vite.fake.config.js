import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
const real = path.resolve("src/lib/supabaseClient.js");
const fake = path.resolve("test-fake/fakeSupabase.js");
export default defineConfig({
  plugins: [
    { name: "fake-supabase", enforce: "pre", resolveId(source, importer) { if (source.endsWith("supabaseClient.js") && importer && !importer.includes("test-fake")) return fake; } },
    react(),
  ],
  base: "./",
  build: { outDir: "dist-fake" },
});
