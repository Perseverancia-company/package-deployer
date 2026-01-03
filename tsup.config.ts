import { defineConfig } from "tsup";

/**
 * Export tsup configuration
 */
export default defineConfig({
    entry: ["src/index.ts", "src/cli/index.ts"],
    format: ["cjs", "esm"], // Build for cjs and esm
    dts: true, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: true,
    clean: true,
});
