import cron from "node-cron";
import config from "./config/config";
import { giftService } from "./services/gift.service";
import { logger } from "./utils/logger";

export const startCronJobs = () => {
	cron.schedule(config.api.updateInterval, async () => {
		logger.info("Starting scheduled gift data update...");

		const newTypes = await giftService.checkForNewTypes();
		if (newTypes.length > 0) {
			logger.info(
				`Found ${
					newTypes.length
				} new gift types in scheduled update: ${newTypes.join(", ")}`
			);

			for (const typeName of newTypes) {
				logger.info(`Updating new gift type: ${typeName}`);
				await giftService.updateGiftType(typeName);
				logger.success(`New gift type ${typeName} updated successfully`);
			}
		}
		await giftService.updateGifts(false);
		logger.success("Scheduled gift data update completed");
	});
};
