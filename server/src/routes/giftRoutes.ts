// src/routes/giftRoutes.ts
import { Router, Request, Response } from "express";
import { GiftController } from "../controllers/giftController";

export function createGiftRouter(controller: GiftController): Router {
	const router = Router();

	router.get("/", (req: Request, res: Response) => {
		controller.getAllGifts(req, res);
	});

	router.get("/:id", (req: Request, res: Response) => {
		controller.getGiftById(req, res);
	});

	router.get("/:id/stats", (req: Request, res: Response) => {
		controller.getGiftStats(req, res);
	});

	router.get("/:id/history", (req: Request, res: Response) => {
		controller.getGiftHistory(req, res);
	});

	router.get("/:id/sticker", (req: Request, res: Response) => {
		controller.getGiftSticker(req, res);
	});

	router.post("/update", async (req: Request, res: Response) => {
		try {
			const result = await controller.updateGifts();
			res.json(result);
		} catch (error) {
			res.status(500).json({ error: "Failed to update gifts" });
		}
	});

	return router;
}
