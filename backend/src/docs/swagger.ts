import fs from "node:fs";
import path from "node:path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express, RequestHandler } from "express";

// Load generated Zod schemas if they exist
let globalSchemas: Record<string, any> = {};
const schemasPath = path.join(process.cwd(), "src", "docs", "schemas.json");
if (fs.existsSync(schemasPath)) {
  try {
    globalSchemas = JSON.parse(fs.readFileSync(schemasPath, "utf-8"));
  } catch (err) {
    console.error("Failed to load generated Zod schemas:", err);
  }
}

// Helper to filter schemas for a specific module
function filterSchemasForModule(moduleName: string): Record<string, any> {
  const filtered: Record<string, any> = {};
  const normalizedModule = moduleName.toLowerCase();
  for (const [key, val] of Object.entries(globalSchemas)) {
    if (key.toLowerCase().includes(normalizedModule)) {
      filtered[key] = val;
    }
  }
  return filtered;
}

// Dynamic spec generator
function generateOpenApiSpec(moduleName?: string): any {
  const isModule = typeof moduleName === "string" && moduleName.length > 0;
  const title = isModule
    ? `${moduleName!.charAt(0).toUpperCase() + moduleName!.slice(1)} Module API`
    : "All Modules API";
  
  const apis = isModule
    ? [`./src/modules/${moduleName}/**/*.routes.*`]
    : ["./src/modules/**/*.routes.*"];

  const schemas = isModule
    ? filterSchemasForModule(moduleName!)
    : globalSchemas;

  const options: swaggerJsDoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title,
        version: "1.0.0",
        description: isModule 
          ? `Isolated API specifications for the ${moduleName} module`
          : "Combined REST API specifications for all modules",
      },
      servers: [{ url: `/api`, description: "API server" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas,
      },
    },
    apis,
  };

  return swaggerJsDoc(options);
}

export function setupSwagger(app: Express): void {
  // Detect active modules in src/modules
  const modulesDir = path.join(process.cwd(), "src", "modules");
  let activeModules: string[] = [];
  if (fs.existsSync(modulesDir)) {
    activeModules = fs.readdirSync(modulesDir).filter((file) => {
      return fs.statSync(path.join(modulesDir, file)).isDirectory();
    });
  }

  // Pre-compile global spec
  const globalSpec = generateOpenApiSpec();

  // Serve specs dynamically
  app.get("/docs/specs/all.json", (_req, res) => {
    res.json(globalSpec);
  });

  app.get("/docs/specs/:moduleName.json", (req, res) => {
    const { moduleName } = req.params;
    if (activeModules.includes(moduleName)) {
      res.json(generateOpenApiSpec(moduleName));
    } else {
      res.status(404).json({ error: `Module "${moduleName}" not found` });
    }
  });

  // Backward compatibility endpoint
  app.get("/docs.json", (_req, res) => {
    res.json(globalSpec);
  });

  // Configure Swagger UI Dropdown Selector
  const swaggerOptions = {
    swaggerOptions: {
      urls: [
        { url: "/docs/specs/all.json", name: "All Modules" },
        ...activeModules.map((m) => ({
          url: `/docs/specs/${m}.json`,
          name: `${m.charAt(0).toUpperCase() + m.slice(1)} Module`,
        })),
      ],
    },
  };

  const serveHandler: RequestHandler[] = swaggerUi.serve;
  const setupHandler: RequestHandler = swaggerUi.setup(undefined, swaggerOptions);

  app.use("/docs", ...serveHandler, setupHandler);
}
