import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const dist = path.resolve("dist");
const files = fs
  .readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) =>
    path
      .relative(dist, path.join(entry.parentPath, entry.name))
      .replaceAll("\\", "/"),
  )
  .filter(
    (name) =>
      /\.(js|css|webp|woff2|png|html|webmanifest)$/.test(name) &&
      name !== "sw.js",
  );
const version = createHash("sha256")
  .update(
    files
      .map(
        (name) =>
          name +
          createHash("sha256")
            .update(fs.readFileSync(path.join(dist, name)))
            .digest("hex"),
      )
      .join("|"),
  )
  .digest("hex")
  .slice(0, 12);
const template = fs.readFileSync("scripts/service-worker.js.tpl", "utf8");
fs.writeFileSync(
  path.join(dist, "sw.js"),
  template
    .replace("__VERSION__", version)
    .replace(
      "/*__PRECACHE__*/",
      JSON.stringify(files.map((name) => "/" + name)),
    ),
);
console.log("PWA precache:", files.length, "assets, version", version);
