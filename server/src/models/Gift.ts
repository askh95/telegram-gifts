// src/models/Gift.ts
export interface Gift {
	telegram_id: string;
	custom_emoji_id: string;
	emoji: string;
	file_id: string;
	file_size: number;
	file_unique_id: string;
	height: number;
	width: number;
	is_animated: boolean;
	is_video: boolean;
	star_count: number;
	remaining_count: number;
	total_count?: number;
	status: "active" | "sold_out";
	last_updated: string;
}

export interface TelegramGiftResponse {
	id: string;
	sticker: {
		custom_emoji_id: string;
		emoji: string;
		file_id: string;
		file_size: number;
		file_unique_id: string;
		height: number;
		width: number;
		is_animated: boolean;
		is_video: boolean;
	};
	star_count: number;
	remaining_count?: number;
	total_count?: number;
}
