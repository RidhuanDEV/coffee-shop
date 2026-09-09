import { DataTypes,literal } from 'sequelize';
import type { QueryInterface } from 'sequelize';
export async function up(q:QueryInterface):Promise<void>{await q.addColumn('payment_events','occurred_at',{type:DataTypes.DATE,allowNull:false,defaultValue:literal('CURRENT_TIMESTAMP')});}
export async function down(q:QueryInterface):Promise<void>{await q.removeColumn('payment_events','occurred_at');}
