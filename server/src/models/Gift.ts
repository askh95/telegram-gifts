// src/models/Gift.ts

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
		type?: string;
		thumbnail?: {
			file_id: string;
			file_unique_id: string;
			file_size: number;
			width: number;
			height: number;
		};
		thumb?: {
			file_id: string;
			file_unique_id: string;
			file_size: number;
			width: number;
			height: number;
		};
	};
	star_count: number;
	remaining_count?: number;
	total_count?: number;
}

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
	thumbnail_file_id?: string;
	thumbnail_file_unique_id?: string;
	thumbnail_file_size?: number;
	thumbnail_width?: number;
	thumbnail_height?: number;
	thumb_file_id?: string;
	thumb_file_unique_id?: string;
	thumb_file_size?: number;
	thumb_width?: number;
	thumb_height?: number;
	star_count: number;
	remaining_count: number;
	total_count?: number;
	status: "active" | "sold_out";
	last_updated: string;
}
