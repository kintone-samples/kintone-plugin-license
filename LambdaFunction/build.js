import { build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "cjs",
  target: ["node20"],
  outfile: "dist/index.js",
};
await build(options);
