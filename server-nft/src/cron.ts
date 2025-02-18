// src/cron.ts
import cron from "node-cron";
import config from "./config/config";
import { giftService } from "./services/gift.service";

export const startCronJobs = () => {
	cron.schedule(config.api.updateInterval, async () => {
		console.log("Starting gift data update...");
		await giftService.updateGifts();
		console.log("Gift data update completed");
	});
};
