// src/services/telegram.service.ts
import { TelegramClient } from "@mtcute/node";
import { logger } from "../utils/logger";

export class TelegramService {
	private static instance: TelegramService;
	private client: TelegramClient;
	private isInitialized: boolean = false;

	private constructor() {
		if (!process.env.API_ID || !process.env.API_HASH) {
			throw new Error(
				"API_ID and API_HASH must be provided in environment variables"
			);
		}

		this.client = new TelegramClient({
			apiId: Number(process.env.API_ID),
			apiHash: process.env.API_HASH,
			storage: "my-account",
		});
	}

	public static getInstance(): TelegramService {
		if (!TelegramService.instance) {
			TelegramService.instance = new TelegramService();
		}
		return TelegramService.instance;
	}

	public async init(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			logger.info("Initializing Telegram client...");

			const self = await this.client.start({
				phone: () => this.client.input("Phone number > "),
				code: () => this.client.input("Code > "),
				password: () => this.client.input("2FA Password > "),
			});

			logger.success(`Logged in as ${self.displayName}`);
			this.isInitialized = true;
		} catch (error) {
			logger.error(`Failed to initialize Telegram client: ${error}`);
			throw error;
		}
	}

	public async getGiftData(giftType: string, number: number) {
		if (!this.isInitialized) {
			throw new Error("Telegram client is not initialized");
		}

		try {
			const giftSlug = `${giftType}-${number}`;
			const gift = await this.client.getUniqueStarGift(giftSlug);

			if (!gift || !gift.raw) {
				return null;
			}

			return {
				owner: gift.owner
					? {
							id: gift.owner.id,
							displayName: gift.owner.displayName,
							username: gift.owner.username,
					  }
					: null,
				ownerName: gift.ownerName,
				num: number,
				model: gift.model?.name || "",
				slug: giftSlug,
				issued: gift.raw.availabilityIssued || 0,
				total: gift.raw.availabilityTotal || 0,
			};
		} catch (error) {
			logger.error(
				`Failed to fetch gift data for ${giftType}-${number}: ${error}`
			);
			return null;
		}
	}
}

export const telegramService = TelegramService.getInstance();
