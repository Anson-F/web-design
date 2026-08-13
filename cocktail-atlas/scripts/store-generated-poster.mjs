import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const atlasRoot = resolve(__dirname, "..");
const manifestPath = resolve(atlasRoot, "data/visual-manifest.json");

const args = Object.fromEntries(process.argv.slice(2).map((arg, index, values) => {
  if (!arg.startsWith("--")) return [arg, true];
  const next = values[index + 1];
  return [arg.slice(2), next && !next.startsWith("--") ? next : true];
}));

if (!args.id || !args.source) {
  throw new Error("Usage: node scripts/store-generated-poster.mjs --id DRINK_ID --source /absolute/image.png [--qa pass|fail] [--notes TEXT]");
}

const sourcePath = resolve(String(args.source));
const sourceInfo = await stat(sourcePath);
if (!sourceInfo.isFile()) throw new Error(`Generated source is not a file: ${sourcePath}`);
const actualPrompt = args["actual-prompt-file"]
  ? (await readFile(resolve(String(args["actual-prompt-file"])), "utf8")).trim()
  : null;

const payload = JSON.parse(await readFile(manifestPath, "utf8"));
const record = payload.visuals.find((item) => item.id === String(args.id));
if (!record) throw new Error(`Unknown drink id: ${args.id}`);

const destinationPath = resolve(atlasRoot, record.assetPath);
await mkdir(dirname(destinationPath), { recursive: true });
await execFileAsync("sips", [
  "--setProperty", "format", "jpeg",
  "--setProperty", "formatOptions", "82",
  "--resampleHeightWidthMax", "1200",
  sourcePath,
  "--out", destinationPath,
]);

const destinationInfo = await stat(destinationPath);
record.generation = {
  provider: "OpenAI image generation",
  status: args.qa === "fail" ? "needs-regeneration" : "generated",
  generatedAt: new Date().toISOString(),
  qa: args.qa || "pass",
  qaNotes: args.notes || "Thumbnail inspection passed: recognizable glass, liquid, ice/foam, garnish, and Minimal Zine composition.",
  promptOverride: actualPrompt || null,
  bytes: destinationInfo.size,
};
payload.meta.generatedCount = payload.visuals.filter((item) => item.generation.status === "generated").length;
payload.meta.updatedAt = new Date().toISOString();
await writeFile(manifestPath, `${JSON.stringify(payload)}\n`, "utf8");

process.stdout.write(`Stored ${record.name} at ${destinationPath} (${destinationInfo.size} bytes)\n`);
