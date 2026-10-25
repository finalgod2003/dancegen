import fs from "node:fs";
import path from "node:path";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

if (process.env.DANCECLIP_BUILD_PRELOAD === "1") {
  // OpenNext copies pnpm directory links without the Windows link type.
  if (process.platform === "win32") {
    const symlinkSync = fs.symlinkSync;
    fs.symlinkSync = (target, destination, type) => {
      if (!type) {
        const resolved = path.resolve(path.dirname(destination), target);
        const relative = path.relative(path.resolve(".open-next/server-functions/default"), destination);
        const original = path.resolve(".next/standalone", relative);
        const directory = (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) ||
          (!relative.startsWith("..") && fs.existsSync(original) && fs.statSync(original).isDirectory());
        if (directory) {
          return symlinkSync(resolved, destination, "junction");
        }
      }
      return symlinkSync(target, destination, type);
    };
    syncBuiltinESMExports();
  }
} else {
  if (process.platform === "win32" && Number(process.versions.node.split(".")[0]) < 24) {
    throw new Error("Use Node.js 24 or newer for the Windows Cloudflare build.");
  }
  const font = path.join(path.dirname(require.resolve("next/package.json")), "dist/compiled/@vercel/og/Geist-Regular.ttf");
  // The adapter renames this font; restore it before a subsequent Next build.
  if (!fs.existsSync(font) && fs.existsSync(`${font}.bin`)) fs.copyFileSync(`${font}.bin`, font);
  const cli = path.resolve(path.dirname(require.resolve("@opennextjs/cloudflare")), "../cli/index.js");
  const result = spawnSync(process.execPath, ["--import", import.meta.url, cli, "build", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, DANCECLIP_BUILD_PRELOAD: "1" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  const handler = ".open-next/server-functions/default/handler.mjs";
  const source = fs.readFileSync(handler, "utf8").replace(/import\("([^"\n]*Geist-Regular\.ttf\.bin)"\)/g, (match, encoded) => {
    const fontPath = JSON.parse(`"${encoded}"`);
    if (!path.isAbsolute(fontPath)) return match;
    fs.copyFileSync(fontPath, path.join(path.dirname(handler), "Geist-Regular.ttf.bin"));
    return 'import("./Geist-Regular.ttf.bin")';
  });
  fs.writeFileSync(handler, source);
  // Production credentials come from encrypted Worker bindings, not bundled .env files.
  fs.writeFileSync(".open-next/cloudflare/next-env.mjs", "export const production = {};\nexport const development = {};\nexport const test = {};\n");
}
