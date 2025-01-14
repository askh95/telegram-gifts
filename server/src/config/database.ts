// src/config/database.ts
import { Pool } from "pg";

const pool = new Pool({
	connectionString:
		"postgresql://neondb_owner:f0aOTgDnLpm7@ep-withered-sun-a5oarc13.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

export async function initializeDatabase() {
	try {
		// Создаем основную таблицу gifts
		await pool.query(`
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
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

		// Создаем таблицу истории
		await pool.query(`
            CREATE TABLE IF NOT EXISTS gifts_history (
                id SERIAL PRIMARY KEY,
                telegram_id TEXT,
                remaining_count INTEGER,
                total_count INTEGER,
                change_amount INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (telegram_id) REFERENCES gifts(telegram_id)
            )
        `);

		// Проверяем существование колонки change_amount
		const { rows: columns } = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'gifts_history' AND column_name = 'change_amount'
        `);

		if (columns.length === 0) {
			await pool.query(`
                ALTER TABLE gifts_history 
                ADD COLUMN change_amount INTEGER DEFAULT 0
            `);
		}

		// Создаем индексы
		await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_gifts_history_telegram_id ON gifts_history(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_gifts_history_last_updated ON gifts_history(last_updated);
            CREATE INDEX IF NOT EXISTS idx_gifts_history_change_amount ON gifts_history(change_amount)
        `);

		console.log("Database initialized successfully");
		return pool;
	} catch (error) {
		console.error("Database initialization error:", error);
		throw error;
	}
}

export default pool;
