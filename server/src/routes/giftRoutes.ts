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

	return router;
}
