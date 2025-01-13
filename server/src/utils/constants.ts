import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const DATABASE_PATH = process.env.DATABASE_PATH || "./database.sqlite";
export const UPDATE_INTERVAL = Number(process.env.UPDATE_INTERVAL) || 5000;
export const STATS_UPDATE_INTERVAL =
	Number(process.env.STATS_UPDATE_INTERVAL) || 300000;
