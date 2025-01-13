// src/config/database.ts
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { DATABASE_PATH } from "../utils/constants";

export async function initializeDatabase() {
	const db = await open({
		filename: DATABASE_PATH,
		driver: sqlite3.Database,
	});

	await db.exec(`
    CREATE TABLE IF NOT EXISTS gifts (
        telegram_id TEXT PRIMARY KEY,
        custom_emoji_id TEXT,
        emoji TEXT,
        file_id TEXT,
        file_size INTEGER,
        file_unique_id TEXT,
        height INTEGER,
        width INTEGER,
        is_animated BOOLEAN,
        is_video BOOLEAN,
        star_count INTEGER,
        remaining_count INTEGER,
        total_count INTEGER,
        status TEXT DEFAULT 'active',
        thumbnail_file_id TEXT,
        thumbnail_file_unique_id TEXT,
        thumbnail_file_size INTEGER,
        thumbnail_width INTEGER,
        thumbnail_height INTEGER,
        thumb_file_id TEXT,
        thumb_file_unique_id TEXT,
        thumb_file_size INTEGER,
        thumb_width INTEGER,
        thumb_height INTEGER,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

	await db.exec(`
    CREATE TABLE IF NOT EXISTS gifts_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT,
        remaining_count INTEGER,
        total_count INTEGER,
        change_amount INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES gifts(telegram_id)
    )`);

	const tableInfo = await db.all("PRAGMA table_info(gifts_history)");
	const hasChangeAmount = tableInfo.some((col) => col.name === "change_amount");

	if (!hasChangeAmount) {
		await db.exec(
			"ALTER TABLE gifts_history ADD COLUMN change_amount INTEGER DEFAULT 0"
		);
	}

	const giftsTableInfo = await db.all("PRAGMA table_info(gifts)");

	const columns = [
		{ name: "thumbnail_file_id", type: "TEXT" },
		{ name: "thumbnail_file_unique_id", type: "TEXT" },
		{ name: "thumbnail_file_size", type: "INTEGER" },
		{ name: "thumbnail_width", type: "INTEGER" },
		{ name: "thumbnail_height", type: "INTEGER" },
		{ name: "thumb_file_id", type: "TEXT" },
		{ name: "thumb_file_unique_id", type: "TEXT" },
		{ name: "thumb_file_size", type: "INTEGER" },
		{ name: "thumb_width", type: "INTEGER" },
		{ name: "thumb_height", type: "INTEGER" },
	];

	for (const column of columns) {
		if (!giftsTableInfo.some((col) => col.name === column.name)) {
			await db.exec(
				`ALTER TABLE gifts ADD COLUMN ${column.name} ${column.type}`
			);
		}
	}

	await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_gifts_history_telegram_id ON gifts_history(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_gifts_history_last_updated ON gifts_history(last_updated);
    CREATE INDEX IF NOT EXISTS idx_gifts_history_change_amount ON gifts_history(change_amount);
    `);

	return db;
}
