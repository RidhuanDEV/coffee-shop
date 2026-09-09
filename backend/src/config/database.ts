import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: false,
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
});
