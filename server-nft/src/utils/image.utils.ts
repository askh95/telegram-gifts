// src/utils/image.utils.ts
import { logger } from "./logger";
import { imageService } from "../services/image.service";

export class ImageUtils {
	private static readonly BASE_URL = "https://cdn.changes.tg/gifts/models";

	static formatGiftName(name: string): string {
		if (name === "DurovsCap") {
			return "Durov's Cap";
		}
		if (name === "BDayCandle") {
			return "B-Day Candle";
		}

		return name.replace(/([A-Z])/g, " $1").trim();
	}

	static async downloadImage(
		giftName: string,
		modelName: string
	): Promise<string | null> {
		try {
			let imageId = await imageService.getImageByGiftAndModel(
				giftName,
				modelName
			);

			if (!imageId) {
				const formattedGiftName = ImageUtils.formatGiftName(giftName);
				const url = `${ImageUtils.BASE_URL}/${encodeURIComponent(
					formattedGiftName
				)}/png/${encodeURIComponent(modelName)}.png`;

				logger.info(`Trying to download image from: ${url}`);
				imageId = await imageService.saveImage(url, giftName, modelName);
			}

			return `/api/images/${imageId}`;
		} catch (error) {
			logger.error(
				`Failed to process image for ${giftName} - ${modelName}: ${error}`
			);
			return null;
		}
	}
}
