// src/utils/image.utils.ts
import { logger } from "./logger";
import { imageService } from "../services/image.service";

export class ImageUtils {
	private static readonly BASE_URL = "https://cdn.changes.tg/gifts/models";

	static formatGiftName(name: string): string {
		return name.replace(/([A-Z])/g, " $1").trim();
	}

	static async downloadImage(
		giftName: string,
		modelName: string
	): Promise<string | null> {
		try {
			// Проверяем, есть ли уже такое изображение
			let imageId = await imageService.getImageByGiftAndModel(
				giftName,
				modelName
			);

			if (!imageId) {
				// Если нет, скачиваем и сохраняем
				const formattedGiftName = ImageUtils.formatGiftName(giftName);
				const url = `${ImageUtils.BASE_URL}/${encodeURIComponent(
					formattedGiftName
				)}/png/${encodeURIComponent(modelName)}.png`;

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
