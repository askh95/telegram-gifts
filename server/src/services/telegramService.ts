import axios from "axios";
import { TELEGRAM_BOT_TOKEN } from "../utils/constants";
import { TelegramGiftResponse } from "../models/Gift";

export async function fetchGifts() {
	try {
		const response = await axios.get(
			`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getAvailableGifts`
		);

		console.log("Total gifts from API:", response.data.result.gifts.length);

		const filteredGifts = response.data.result.gifts.filter(
			(gift: TelegramGiftResponse) => "remaining_count" in gift
		);

		console.log("Gifts after filtering:", filteredGifts.length);
		return filteredGifts;
	} catch (error) {
		console.error("Error fetching gifts:", error);
		throw error;
	}
}
