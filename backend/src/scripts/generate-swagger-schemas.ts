import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS_JSON_PATH = path.join(SRC, "docs", "schemas.json");

function findSchemaFiles(dir: string, filesList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findSchemaFiles(fullPath, filesList);
    } else if (file.endsWith(".schema.ts")) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

async function generate(): Promise<void> {
  const schemaFiles = findSchemaFiles(SRC);
  const schemas: Record<string, any> = {};

  for (const file of schemaFiles) {
    const fileUrl = pathToFileURL(file).href;
    const module = await import(fileUrl);
    
    for (const [key, value] of Object.entries(module)) {
      if (value && typeof value === "object" && (value instanceof z.ZodType || "toJSONSchema" in value || "_def" in value)) {
        // Convert Zod schema to JSON Schema natively using Zod v4
        const rawSchema = (value as any).toJSONSchema() as any;

        // Clean up schema for OpenAPI component mapping
        const cleanSchema = { ...rawSchema };
        delete cleanSchema.$schema;

        // Clean up name by removing "Schema" (case-insensitive)
        const cleanKey = key.replace(/schema$/i, "");
        // Capitalize the name (e.g. "createUserSchema" -> "CreateUser")
        const schemaName = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
        schemas[schemaName] = cleanSchema;
      }
    }
  }

  const dir = path.dirname(SCHEMAS_JSON_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(SCHEMAS_JSON_PATH, JSON.stringify(schemas, null, 2), "utf-8");
  console.log(`\x1b[32m✓ Successfully synced ${Object.keys(schemas).length} Zod schemas to: src/docs/schemas.json\x1b[0m`);
}

generate().catch((err) => {
  console.error("Error generating Swagger schemas:", err);
  process.exit(1);
});
