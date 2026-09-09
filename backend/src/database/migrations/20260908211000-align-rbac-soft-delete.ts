import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";
export async function up(q: QueryInterface): Promise<void> {
  for (const table of ["roles", "permissions"])
    await q.addColumn(table, "deleted_at", {
      type: DataTypes.DATE,
      allowNull: true,
    });
}
export async function down(q: QueryInterface): Promise<void> {
  for (const table of ["permissions", "roles"])
    await q.removeColumn(table, "deleted_at");
}
