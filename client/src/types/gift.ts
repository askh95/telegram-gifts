export interface Gift {
	telegram_id: string;
	custom_emoji_id: string;
	emoji: string;
	file_id: string;
	file_size: number;
	file_unique_id: string;
	height: number;
	width: number;
	is_animated: number;
	is_video: number;
	star_count: number;
	remaining_count: number;
	total_count: number;
	status: string;
	last_updated: string;
	last_prediction_id: string | null;
	thumbnail_file_id: string;
	thumbnail_file_unique_id: string;
	thumbnail_file_size: number;
	thumbnail_width: number;
	thumbnail_height: number;
}

export interface GiftDetails extends Gift {
	last_purchase: string;
	last_purchase_amount: number;
}

export interface GiftStats {
	gift_id: string;
	current_count: number;
	total_count: number;
	status: string;
	analytics: {
		peak_hour: {
			hour: string;
			count: number;
		};
		purchase_rate: number;
		prediction: {
			remaining: number;
			predicted_sold_out: string;
			confidence: number;
			avg_hourly_rate: number;
			hours_elapsed: number;
			total_purchases_24h: number;
		};
		hourly_stats: Array<{
			hour: string;
			count: number;
		}>;
	};
	last_updated: string;
}

export interface GiftHistory {
	remaining_count: number;
	total_count: number;
	change_amount: number;
	last_updated: string;
	emoji: string;
}

export interface GiftSticker {
	file_url: string;
	thumbnail_file_id: string;
	thumb_file_id: string;
}

export interface GiftsQueryParams {
	minStars?: number;
	maxStars?: number;
	minRemaining?: number;
	maxRemaining?: number;
	limit?: number;
	page?: number;
	status?: "active" | "sold_out";
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface CryptoAddress {
	name: string;
	address?: string;
	shortAddress?: string;
	color: string;
	special?: boolean;
}

export type CopySuccessMessage = string;

export interface Gift {
	id: string;
	name: string;
	thumbnail?: string;
}

export interface GiftNameMapping {
	[key: string]: string;
}
