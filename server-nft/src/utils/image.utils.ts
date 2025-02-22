// src/utils/image.utils.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

export class ImageUtils {
	private static readonly BASE_URL = "https://cdn.changes.tg/gifts/models";
	private static readonly IMAGE_PATH = path.join(
		process.cwd(),
		"public",
		"images",
		"gifts"
	);

	static async ensureImageDirectory(): Promise<void> {
		if (!fs.existsSync(ImageUtils.IMAGE_PATH)) {
			fs.mkdirSync(ImageUtils.IMAGE_PATH, { recursive: true });
		}
	}

	static formatGiftName(name: string): string {
		return name.replace(/([A-Z])/g, " $1").trim();
	}

	static async downloadImage(
		giftName: string,
		modelName: string
	): Promise<string | null> {
		try {
			await ImageUtils.ensureImageDirectory();

			const formattedGiftName = ImageUtils.formatGiftName(giftName);
			const url = `${ImageUtils.BASE_URL}/${encodeURIComponent(
				formattedGiftName
			)}/png/${encodeURIComponent(modelName)}.png`;

			const filename = `${giftName}-${modelName.replace(/\s+/g, "-")}.png`;
			const filepath = path.join(ImageUtils.IMAGE_PATH, filename);

			const response = await axios({
				method: "GET",
				url: url,
				responseType: "stream",
			});

			const writer = fs.createWriteStream(filepath);
			response.data.pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on("finish", () => resolve());
				writer.on("error", (error) => reject(error));
			});

			return `/images/gifts/${filename}`;
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to download image for ${giftName} - ${modelName}: ${error.message}`
				);
			} else {
				logger.error(
					`Failed to download image for ${giftName} - ${modelName}: Unknown error`
				);
			}
			return null;
		}
	}
}
