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

	const db = await initializeDatabase();
	const giftController = new GiftController(db);

	let previousGiftCounts = new Map<string, number>();

	async function updateGifts() {
		try {
			const beforeUpdate = await db.all(
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

	setInterval(updateGifts, UPDATE_INTERVAL);

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

startServer().catch((error) => console.error("Server start error:", error));
