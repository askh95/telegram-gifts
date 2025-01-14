import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const DATABASE_URL = process.env.DATABASE_URL;
export const UPDATE_INTERVAL = Number(process.env.UPDATE_INTERVAL) || 5000;
