import axios from "axios";
import { TELEGRAM_BOT_TOKEN } from "../utils/constants";
import { TelegramGiftResponse } from "../models/Gift";

export async function fetchGifts(): Promise<TelegramGiftResponse[]> {
	try {
		const response = await axios.get<{
			ok: boolean;
			result: {
				gifts: TelegramGiftResponse[];
			};
		}>(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getAvailableGifts`);

		const filteredGifts = response.data.result.gifts.filter(
			(gift: TelegramGiftResponse) => "remaining_count" in gift
		);

		return filteredGifts;
	} catch (error) {
		console.error("Error fetching gifts:", error);
		throw error;
	}
}
