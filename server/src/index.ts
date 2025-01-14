// src/index.ts
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import { createGiftRouter } from "./routes/giftRoutes";
import { GiftController } from "./controllers/giftController";
import { PORT, UPDATE_INTERVAL } from "./utils/constants";

async function startServer() {
	const app = express();
	app.use(cors());
	app.use(express.json());

	const pool = await initializeDatabase();
	const giftController = new GiftController(pool);

	let previousGiftCounts = new Map<string, number>();

	async function updateGifts() {
		try {
			const { rows: beforeUpdate } = await pool.query(
				"SELECT telegram_id, remaining_count FROM gifts"
			);

			beforeUpdate.forEach((gift) => {
				previousGiftCounts.set(gift.telegram_id, gift.remaining_count);
			});

			await giftController.updateGifts();
		} catch (error) {
			console.error("Update error:", error);
		}
	}

	app.use("/api/gifts", createGiftRouter(giftController));

	await updateGifts();

	const updateInterval = setInterval(updateGifts, UPDATE_INTERVAL);

	process.on("SIGTERM", async () => {
		clearInterval(updateInterval);
		await pool.end();
		process.exit(0);
	});

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

startServer().catch((error) => console.error("Server start error:", error));
