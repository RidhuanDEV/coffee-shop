# 📘 Developer & API Documentation Guide

Welcome to the Developer Guide! This document outlines the architectural patterns, standard practices, and automated workflows of this codebase. Every developer working on this project must adhere strictly to these guidelines to maintain a clean, modular, and highly performant backend.

---

## 🏗️ 1. Codebase Architecture (Modular Pattern)

The backend follows a strict **Modular Pattern**. Instead of splitting files into generic global folders (like all controllers in one folder, all models in another), everything related to a business feature is co-located in its own feature module folder under `src/modules/`.

### Folder Structure of a Feature Module

For any feature (e.g., `products`), it should be located at `src/modules/products/` and contain:
```text
src/modules/products/
├── mappers/
│   └── products.mapper.ts      # Maps database models to clean HTTP Response Dtos
├── policies/
│   └── products.policy.ts      # Handles resource-level ownership/authorization checks
├── queries/
│   └── products.query.ts       # Defines filters, sorting allowlists, and default includes
├── dto/
│   ├── create-products.dto.ts  # Types for creation payload
│   ├── update-products.dto.ts  # Types for update payload
│   └── search-products.dto.ts  # Types for list query parameters
├── products.model.ts           # Sequelize database model definition
├── products.repository.ts      # Database queries (CRUD operations on the model)
├── products.service.ts         # Business logic layer (handles cache, audit logs, transactions)
├── products.controller.ts      # Controller layer (handles req/res parsing and route context)
├── products.routes.ts          # Route declarations, middleware bindings, and Swagger annotations
└── products.schema.ts          # Zod schema validation rules (Zod v4)
```

---

## 🆔 2. Primary Key Generation (Native UUIDv7)

To ensure high-performance database indexing and chronological time-ordered primary keys, this project uses **native UUIDv7** generated at the application layer.

*   **Rule**: **NEVER** install third-party libraries like `"uuid"` for generating UUIDs in the application code.
*   **Implementation**: Use the built-in Node.js crypto module via our central utility:
    ```typescript
    import { generateUuidV7 } from "../../utils/uuid.js";
    ```
*   **Model Configuration**:
    ```typescript
    id: {
      type: DataTypes.UUID,
      defaultValue: () => generateUuidV7(), // Evaluated on every insert
      primaryKey: true,
    }
    ```

---

## 📝 3. Automated API Documentation (Zod to Swagger Sync)

This codebase features a **fully automated Swagger sync workflow**. Developers **do not** need to manually document JSON properties, types, optional states, or constraints (like `minLength`, `maxLength`) in their routes.

### How to Group & Auto-Sync APIs:

1.  **Zod Schema (Source of Truth)**:
    Define your standard Zod schemas as usual in `<module-name>.schema.ts` (using Zod v4). Add all validation constraints:
    ```typescript
    import { z } from "zod";

    export const createProductSchema = z.object({
      name: z.string().min(1).max(128),
      price: z.number().positive(),
    });
    ```

2.  **Synchronize Schemas**:
    Run the single sync command to compile all Zod schemas into Swagger Components:
    ```bash
    npm run api-docs
    ```
    This generates `src/docs/schemas.json`, which Swagger dynamically loads into `components.schemas` under clean, professional names like `CreateProduct` and `UpdateProduct` (removing the redundant "Schema" suffix).

3.  **Modular Grouping (Tags)**:
    In your routing file `*.routes.ts`, write basic `@openapi` JSDoc comments above endpoints. Group them per-feature using the `tags` field (e.g. `tags: [Product]`). **Use `$ref` to reference the auto-synced Zod schemas**:
    ```typescript
    /**
     * @openapi
     * /products:
     *   post:
     *     tags: [Product]  # <-- Grouping by feature module
     *     summary: Create product
     *     security:
     *       - bearerAuth: []
     *     requestBody:
      *       required: true
      *       content:
      *         application/json:
      *           schema:
      *             $ref: '#/components/schemas/CreateProduct' # <-- Auto-synced & clean!
     *     responses:
     *       201:
     *         description: Created
     */
    router.post("/", authenticate, validate({ body: createProductSchema }), controller.create);
    ```

Swagger UI will automatically display this endpoint under a dedicated, collapsible **Product** section in the API docs page (`/docs`), separating it cleanly from other modules!

---

## ⚡ 4. CRUD Generator Command

Whenever you need a new feature module, use the built-in generator to automatically create all boilerplate files—including pre-formatted models, repositories, and **automatically tagged Swagger routes**:

```bash
npm run make:crud <name-in-kebab-case>
```
*Example:* `npm run make:crud blog-post`

Once generated:
1.  Run `npm run api-docs` to register the new schemas.
2.  Start coding your custom domain columns.

---

## ⚠️ 5. Strict Coding Rules

1.  **Strict TypeScript**:
    *   **NO `any` or `unknown`** type usage.
    *   **NO arbitrary typecasting** (`as type`) unless absolutely necessary for extending third-party modules. All models and Dtos must be strictly declared.
2.  **No Dead Code**:
    *   Whenever you refactor code, immediately delete unused imports, dead variables, or obsolete packages from `package.json`.
3.  **Local Module Imports**:
    *   Since this project uses ES Modules (`"type": "module"`), all local file imports **MUST include the `.js` extension** (e.g. `import { userQueryConfig } from "./queries/user.query.js"`).
