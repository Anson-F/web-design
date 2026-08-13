import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, "../data/visual-manifest.json");
const args = Object.fromEntries(process.argv.slice(2).map((arg, index, values) => {
  if (!arg.startsWith("--")) return [arg, true];
  const next = values[index + 1];
  return [arg.slice(2), next && !next.startsWith("--") ? next : true];
}));
const ids = String(args.ids || "").split(",").map((item) => item.trim()).filter(Boolean);
if (!ids.length || !["pass", "fail"].includes(args.status)) {
  throw new Error("Usage: node scripts/mark-poster-qa.mjs --ids ID,ID --status pass|fail [--notes TEXT]");
}

const payload = JSON.parse(await readFile(manifestPath, "utf8"));
const idSet = new Set(ids);
let updated = 0;
for (const record of payload.visuals) {
  if (!idSet.has(record.id)) continue;
  record.generation.qa = args.status;
  record.generation.qaNotes = args.notes || (args.status === "pass"
    ? "Contact-sheet inspection passed for recognizability, glass, liquid, ice/foam, garnish, and composition."
    : "Contact-sheet inspection found a factual or visual mismatch; regenerate once.");
  if (args.status === "fail") record.generation.status = "needs-regeneration";
  updated += 1;
}
if (updated !== ids.length) throw new Error(`Updated ${updated} of ${ids.length} requested records`);
payload.meta.updatedAt = new Date().toISOString();
payload.meta.qaPassCount = payload.visuals.filter((item) => item.generation.qa === "pass").length;
await writeFile(manifestPath, `${JSON.stringify(payload)}\n`, "utf8");
process.stdout.write(`Marked ${updated} posters QA ${args.status}\n`);
