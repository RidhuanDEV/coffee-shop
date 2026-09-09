import type { QueryInterface } from "sequelize";

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    "UPDATE shop_settings SET name = :newName WHERE name = :oldName AND deleted_at IS NULL",
    { replacements: { newName: "Toko Kopi", oldName: "Ruang Seduh" } },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    "UPDATE shop_settings SET name = :oldName WHERE name = :newName AND deleted_at IS NULL",
    { replacements: { newName: "Toko Kopi", oldName: "Ruang Seduh" } },
  );
}
