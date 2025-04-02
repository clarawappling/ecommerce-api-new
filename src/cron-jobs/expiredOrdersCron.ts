import { ResultSetHeader } from "mysql2";
import { db } from "../config/db";

const cron = require('node-cron');

export const removeExpiredOrders = async () => {
  try {
    const sql = `
    DELETE FROM orders
    WHERE payment_status != 'paid'
    AND created_at < NOW() - INTERVAL 1 HOUR
    `;

    await db.query<ResultSetHeader>(sql)
    console.log("Expired orders cleaned successfully")
  } catch (error) {
    console.log("Error cleaning up orders")
  }
};

cron.schedule('0 * * * *', removeExpiredOrders);
console.log('Cron job for expired orders is running...');