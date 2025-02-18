// src/app.ts
import express, { Request, Response } from "express";
import { dbService } from "./services/db.service";
import { giftService } from "./services/gift.service";
import { telegramService } from "./services/telegramService";
import { startCronJobs } from "./cron";
import { logger } from "./utils/logger";
import cors from "cors";
console.log("CORS middleware loaded:", !!cors);

const app = express();
const initialPort = 5002;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	logger.info(`${req.method} ${req.url}`);
	next();
});

app.get("/api/nft/gifts", async (req: Request, res: Response) => {
	try {
		const gifts = await giftService.getGiftsList();
		res.json(gifts);
	} catch (error) {
		logger.error(`Error in /api/nft/gifts: ${error}`);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/nft/gifts/:name", async (req: Request, res: Response) => {
	try {
		const gift = await giftService.getGiftDetails(req.params.name);
		if (!gift) {
			return res.status(404).json({ error: "Gift not found" });
		}
		res.json(gift);
	} catch (error) {
		logger.error(`Error in /api/nft/gifts/${req.params.name}: ${error}`);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/nft/gifts/:name/owners", async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 50;

		const owners = await giftService.getGiftOwners(
			req.params.name,
			page,
			limit
		);
		if (!owners) {
			return res.status(404).json({ error: "Gift not found" });
		}
		res.json(owners);
	} catch (error) {
		logger.error(`Error in /nft/gifts/${req.params.name}/owners: ${error}`);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get(
	"/api/nft/gifts/:name/models/:modelName",
	async (req: Request, res: Response) => {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 50;

			const owners = await giftService.getGiftModelOwners(
				req.params.name,
				req.params.modelName,
				page,
				limit
			);
			if (!owners) {
				return res.status(404).json({ error: "Gift or model not found" });
			}
			res.json(owners);
		} catch (error) {
			logger.error(
				`Error in /api/nft/gifts/${req.params.name}/models/${req.params.modelName}/owners: ${error}`
			);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

app.get("/api/nft/gifts/:name/models", async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const search = req.query.search as string;

		const models = await giftService.getGiftModels(
			req.params.name,
			page,
			limit,
			search
		);
		if (!models) {
			return res.status(404).json({ error: "Gift not found" });
		}
		res.json(models);
	} catch (error) {
		logger.error(`Error in /api/nft/gifts/${req.params.name}/models: ${error}`);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/nft/gifts/:name/history", async (req: Request, res: Response) => {
	try {
		const limit = parseInt(req.query.limit as string) || 10;
		const history = await giftService.getGiftHistory(req.params.name, limit);
		res.json(history);
	} catch (error) {
		logger.error(
			`Error in /api/nft/gifts/${req.params.name}/history: ${error}`
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/nft/users/top", async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 50;

		const topUsers = await giftService.getTopUsers(page, limit);
		res.json(topUsers);
	} catch (error) {
		logger.error(`Error in /api/nft/users/top: ${error}`);
		res.status(500).json({ error: "Internal server error" });
	}
});

const startServer = async (port: number): Promise<void> => {
	try {
		const server = app.listen(port);

		server.on("listening", () => {
			logger.success(`Server is running on port ${port}`);
			logger.info("\nAvailable API endpoints:");
			logger.info("- GET /api/nft/gifts - List all gifts");
			logger.info("- GET /api/nft/gifts/:name - Get gift details");
			logger.info(
				"- GET /api/nft/gifts/:name/owners?page=1&limit=50 - Get gift owners with pagination"
			);
			logger.info(
				"- GET /api/nft/gifts/:name/models - Get gift models with pagination"
			);
			logger.info(
				"- GET /api/nft/gifts/:name/models/:modelName/owners - Get model owners with pagination"
			);
			logger.info(
				"- GET /api/nft/gifts/:name/history - Get gift update history"
			);
			logger.info("- GET /api/nft/users/top - Get top users\n");
		});

		server.on("error", async (error: any) => {
			if (error.code === "EADDRINUSE") {
				logger.warning(`Port ${port} is busy, trying ${port + 1}`);
				await startServer(port + 1);
			} else {
				logger.error(`Server error: ${error.message}`);
				throw error;
			}
		});
	} catch (error) {
		logger.error(`Failed to start server: ${error}`);
		throw error;
	}
};

const startup = async () => {
	try {
		await dbService.connect();
		logger.success("Connected to MongoDB");

		logger.info("Initializing Telegram client...");
		await telegramService.init();
		logger.success("Telegram client initialized");

		startCronJobs();
		logger.info("Cron jobs started");

		const needsUpdate = await giftService.shouldUpdate();
		if (needsUpdate) {
			logger.info("Initial data fetch required...");
			await giftService.updateGifts();
		} else {
			logger.info("Using existing data, next update will be triggered by cron");
		}

		await startServer(initialPort);
	} catch (error) {
		logger.error(`Startup error: ${error}`);
		process.exit(1);
	}
};

process.on("unhandledRejection", (reason, promise) => {
	logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

startup();
