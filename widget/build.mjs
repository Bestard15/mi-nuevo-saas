// Builds the embeddable widget to public/widget.js and enforces the size
// budget: the whole bundle must stay under 30 KB (uncompressed, minified).
import { build } from "esbuild";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.join(root, "..", "public", "widget.js");
const BUDGET_BYTES = 30 * 1024;

await build({
  entryPoints: [path.join(root, "src", "index.ts")],
  outfile,
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  legalComments: "none",
});

const size = statSync(outfile).size;
const kb = (size / 1024).toFixed(1);
if (size > BUDGET_BYTES) {
  console.error(`✖ widget.js pesa ${kb} KB — supera el presupuesto de 30 KB`);
  process.exit(1);
}
console.log(`✓ widget.js: ${kb} KB (presupuesto: 30 KB)`);
