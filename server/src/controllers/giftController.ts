import { Request, Response } from "express";
import { Database } from "sqlite";
import { fetchGifts } from "../services/telegramService";
import { Gift, TelegramGiftResponse } from "../models/Gift";
import { AnalyticsService } from "../services/analyticsService";
import axios from "axios";
import { STATS_UPDATE_INTERVAL, TELEGRAM_BOT_TOKEN } from "../utils/constants";
interface ExistingGift {
	telegram_id: string;
	remaining_count: number;
	total_count: number;
	status: "active" | "sold_out";
}

interface PaginationQuery {
	page?: string;
	limit?: string;
	startDate?: string;
	endDate?: string;
	minChange?: string;
	maxChange?: string;
	minStars?: string;
	maxStars?: string;
	minRemaining?: string;
	maxRemaining?: string;
	status?: string;
}

export class GiftController {
	private db: Database;
	private analyticsService: AnalyticsService;

	constructor(database: Database) {
		this.db = database;
		this.analyticsService = new AnalyticsService(database);
	}

	async updateGifts() {
		try {
			const activeGifts = await this.db.all<ExistingGift[]>(
				"SELECT telegram_id, remaining_count, total_count FROM gifts WHERE status = 'active'"
			);

			const currentGifts = await fetchGifts();
			const currentGiftIds = new Set(
				currentGifts.map((g: TelegramGiftResponse) => g.id)
			);

			const timestamp = new Date().toISOString();

			for (const activeGift of activeGifts) {
				if (!currentGiftIds.has(activeGift.telegram_id)) {
					console.log(
						`Gift ${activeGift.telegram_id} disappeared from API, marking as sold out`
					);

					await this.db.run(
						`UPDATE gifts 
                        SET status = 'sold_out',
                            remaining_count = 0,
                            last_updated = CURRENT_TIMESTAMP
                        WHERE telegram_id = ?`,
						[activeGift.telegram_id]
					);

					await this.db.run(
						`INSERT INTO gifts_history (
                            telegram_id,
                            remaining_count,
                            total_count,
                            change_amount,
                            last_updated
                        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
						[
							activeGift.telegram_id,
							0,
							activeGift.total_count,
							activeGift.remaining_count,
						]
					);
				}
			}

			for (const gift of currentGifts) {
				const existingGift = activeGifts.find((g) => g.telegram_id === gift.id);

				if (existingGift) {
					if (existingGift.remaining_count !== gift.remaining_count) {
						await this.db.run(
							`UPDATE gifts 
                            SET remaining_count = ?,
                                last_updated = CURRENT_TIMESTAMP
                            WHERE telegram_id = ?`,
							[gift.remaining_count, gift.id]
						);

						await this.db.run(
							`INSERT INTO gifts_history (
                                telegram_id,
                                remaining_count,
                                total_count,
                                change_amount,
                                last_updated
                            ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
							[
								gift.id,
								gift.remaining_count,
								gift.total_count,
								existingGift.remaining_count - gift.remaining_count,
							]
						);
					}
				} else {
					await this.db.run(
						`INSERT INTO gifts (
                            telegram_id, custom_emoji_id, emoji, file_id,
                            file_size, file_unique_id, height, width,
                            is_animated, is_video, star_count,
                            remaining_count, total_count, status,
                            thumbnail_file_id, thumbnail_file_unique_id,
                            thumbnail_file_size, thumbnail_width, thumbnail_height,
                            thumb_file_id, thumb_file_unique_id,
                            thumb_file_size, thumb_width, thumb_height,
                            last_updated
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
						[
							gift.id,
							gift.sticker.custom_emoji_id,
							gift.sticker.emoji,
							gift.sticker.file_id,
							gift.sticker.file_size,
							gift.sticker.file_unique_id,
							gift.sticker.height,
							gift.sticker.width,
							gift.sticker.is_animated ? 1 : 0,
							gift.sticker.is_video ? 1 : 0,
							gift.star_count,
							gift.remaining_count,
							gift.total_count,
							"active",
							gift.sticker.thumbnail?.file_id,
							gift.sticker.thumbnail?.file_unique_id,
							gift.sticker.thumbnail?.file_size,
							gift.sticker.thumbnail?.width,
							gift.sticker.thumbnail?.height,
							gift.sticker.thumb?.file_id,
							gift.sticker.thumb?.file_unique_id,
							gift.sticker.thumb?.file_size,
							gift.sticker.thumb?.width,
							gift.sticker.thumb?.height,
						]
					);

					await this.db.run(
						`INSERT INTO gifts_history (
                            telegram_id,
                            remaining_count,
                            total_count,
                            change_amount,
                            last_updated
                        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
						[gift.id, gift.remaining_count, gift.total_count, 0]
					);
				}
			}
		} catch (error) {
			console.error("Error updating gifts:", error);
			throw error;
		}
	}

	async getAllGifts(
		req: Request<any, any, any, PaginationQuery>,
		res: Response
	) {
		try {
			const page = parseInt(req.query.page || "1");
			const limit = parseInt(req.query.limit || "20");
			const offset = (page - 1) * limit;

			let baseQuery = `SELECT * FROM gifts WHERE 1=1`;
			const params: any[] = [];

			if (req.query.status) {
				baseQuery += ` AND status = ?`;
				params.push(req.query.status);
			}

			if (req.query.minStars) {
				baseQuery += ` AND star_count >= ?`;
				params.push(parseInt(req.query.minStars));
			}
			if (req.query.maxStars) {
				baseQuery += ` AND star_count <= ?`;
				params.push(parseInt(req.query.maxStars));
			}

			if (req.query.minRemaining) {
				baseQuery += ` AND remaining_count >= ?`;
				params.push(parseInt(req.query.minRemaining));
			}
			if (req.query.maxRemaining) {
				baseQuery += ` AND remaining_count <= ?`;
				params.push(parseInt(req.query.maxRemaining));
			}

			const queryWithSort = `${baseQuery} 
                ORDER BY 
                    CASE 
                        WHEN status = 'sold_out' THEN 2
                        ELSE 1 
                    END,
                    remaining_count ASC`;

			const finalQuery = `${queryWithSort} LIMIT ? OFFSET ?`;

			const [gifts, total] = await Promise.all([
				this.db.all<Gift[]>(finalQuery, [...params, limit, offset]),
				this.db.get<{ count: number }>(
					`SELECT COUNT(*) as count FROM (${baseQuery})`,
					params
				),
			]);

			res.json({
				data: gifts,
				pagination: {
					total: total?.count || 0,
					page,
					limit,
					totalPages: Math.ceil((total?.count || 0) / limit),
				},
			});
		} catch (error) {
			console.error("Error fetching all gifts:", error);
			res.status(500).json({ error: "Failed to fetch gifts" });
		}
	}

	async getGiftById(req: Request, res: Response) {
		try {
			const [gift, lastPurchase] = await Promise.all([
				this.db.get<Gift>(
					`SELECT 
                        telegram_id,
                        custom_emoji_id,
                        emoji,
                        star_count,
                        remaining_count,
                        total_count,
                        status,
                        last_updated
                    FROM gifts 
                    WHERE telegram_id = ?`,
					req.params.id
				),
				this.db.get(
					`SELECT 
                        change_amount,
                        last_updated as last_purchase
                    FROM gifts_history 
                    WHERE telegram_id = ? AND change_amount > 0
                    ORDER BY last_updated DESC 
                    LIMIT 1`,
					req.params.id
				),
			]);

			if (!gift) {
				return res.status(404).json({ error: "Gift not found" });
			}

			res.json({
				...gift,
				last_purchase: lastPurchase?.last_purchase || null,
				last_purchase_amount: lastPurchase?.change_amount || 0,
			});
		} catch (error) {
			console.error("Error fetching gift by ID:", error);
			res.status(500).json({ error: "Failed to fetch gift details" });
		}
	}

	async getGiftStats(req: Request, res: Response) {
		try {
			const giftId = req.params.id;

			const gift = await this.db.get<Gift>(
				"SELECT * FROM gifts WHERE telegram_id = ?",
				giftId
			);

			if (!gift) {
				return res.status(404).json({ error: "Gift not found" });
			}

			const purchaseHistory = await this.db.all(
				`
                WITH time_slots AS (
                    SELECT 
                        datetime(
                            (strftime('%s', datetime('now', '-24 hours')) / (? / 1000)) * (? / 1000),
                            'unixepoch'
                        ) as slot_start,
                        ? / 1000 as slot_duration
                    UNION ALL
                    SELECT 
                        datetime(
                            strftime('%s', slot_start) + slot_duration,
                            'unixepoch'
                        ),
                        slot_duration
                    FROM time_slots
                    WHERE datetime(slot_start) < datetime('now')
                    LIMIT 288
                )
                SELECT 
                    time_slots.slot_start as timestamp,
                    COALESCE(SUM(gh.change_amount), 0) as change_amount,
                    MAX(gh.remaining_count) as remaining_count,
                    MIN(gh.remaining_count) as min_remaining_count,
                    gh.total_count
                FROM time_slots
                LEFT JOIN gifts_history gh ON 
                    datetime(gh.last_updated) >= datetime(time_slots.slot_start) AND 
                    datetime(gh.last_updated) < datetime(
                        time_slots.slot_start, 
                        '+' || (? / 1000) || ' seconds'
                    ) AND
                    gh.telegram_id = ?
                GROUP BY time_slots.slot_start
                ORDER BY time_slots.slot_start ASC
                `,
				[
					STATS_UPDATE_INTERVAL,
					STATS_UPDATE_INTERVAL,
					STATS_UPDATE_INTERVAL,
					STATS_UPDATE_INTERVAL,
					giftId,
				]
			);

			const hourlyStats = new Map<string, number>();
			purchaseHistory.forEach((record) => {
				const hourEnd = new Date(record.timestamp).getHours() + 1;
				const hour = (hourEnd % 24).toString().padStart(2, "0") + ":00";
				hourlyStats.set(
					hour,
					(hourlyStats.get(hour) || 0) + record.change_amount
				);
			});

			let peakHour = "00:00";
			let peakCount = 0;
			hourlyStats.forEach((count, hour) => {
				if (count > peakCount) {
					peakCount = count;
					peakHour = hour;
				}
			});

			const hourlyStatsArray = Array.from(hourlyStats.entries())
				.map(([hour, count]) => ({
					hour,
					count: Math.round(count),
				}))
				.filter((stat) => stat.count > 0)
				.sort((a, b) => a.hour.localeCompare(b.hour));

			const totalPurchases = hourlyStatsArray.reduce(
				(sum, stat) => sum + stat.count,
				0
			);
			const avgHourlyRate = Math.ceil(totalPurchases / hourlyStatsArray.length);

			let predictedSoldOutDate = null;
			if (avgHourlyRate > 0 && gift.remaining_count > 0) {
				const hoursRemaining = Math.ceil(gift.remaining_count / avgHourlyRate);
				predictedSoldOutDate = new Date();
				predictedSoldOutDate.setHours(
					predictedSoldOutDate.getHours() + hoursRemaining
				);
			}

			const response = {
				gift_id: giftId,
				current_count: gift.remaining_count,
				total_count: gift.total_count,
				status: gift.status,
				analytics: {
					peak_hour: {
						hour: peakHour,
						count: Math.round(peakCount),
					},
					purchase_rate: avgHourlyRate,
					prediction: {
						remaining: gift.remaining_count,
						predicted_sold_out: predictedSoldOutDate?.toISOString() || null,
						confidence: totalPurchases > 0 ? 0.8 : 0,
						avg_hourly_rate: avgHourlyRate,
						total_purchases_24h: totalPurchases,
					},
					hourly_stats: hourlyStatsArray,
				},
				last_updated: gift.last_updated,
				interval_minutes: STATS_UPDATE_INTERVAL / 60000,
			};

			res.json(response);
		} catch (error) {
			console.error("Error in getGiftStats:", error);
			res.status(500).json({
				error: "Failed to fetch gift statistics",
			});
		}
	}

	async getGiftHistory(
		req: Request<any, any, any, PaginationQuery>,
		res: Response
	) {
		try {
			const giftId = req.params.id;
			const page = parseInt(req.query.page || "1");
			const limit = parseInt(req.query.limit || "30");
			const startDate = req.query.startDate;
			const endDate = req.query.endDate;

			const minChange = req.query.minChange
				? parseInt(req.query.minChange)
				: undefined;
			const maxChange = req.query.maxChange
				? parseInt(req.query.maxChange)
				: undefined;

			let query = `
        SELECT 
          h.remaining_count,
          h.total_count,
          h.change_amount,
          h.last_updated,
          g.emoji
        FROM gifts_history h
        JOIN gifts g ON g.telegram_id = h.telegram_id
        WHERE h.telegram_id = ?
      `;
			const params: any[] = [giftId];

			if (startDate) {
				query += " AND h.last_updated >= ?";
				params.push(startDate);
			}
			if (endDate) {
				query += " AND h.last_updated <= ?";
				params.push(endDate);
			}
			if (minChange !== undefined) {
				query += " AND h.change_amount >= ?";
				params.push(minChange);
			}
			if (maxChange !== undefined) {
				query += " AND h.change_amount <= ?";
				params.push(maxChange);
			}

			const [history, total] = await Promise.all([
				this.db.all(
					query +
						` 
          ORDER BY h.last_updated DESC
          LIMIT ? OFFSET ?`,
					[...params, limit, (page - 1) * limit]
				),
				this.db.get<{ count: number }>(
					`SELECT COUNT(*) as count FROM (${query}) as subquery`,
					params
				),
			]);

			if (history.length === 0) {
				return res
					.status(404)
					.json({ error: "No history found for this gift" });
			}

			res.json({
				data: history,
				pagination: {
					total: total?.count || 0,
					page,
					limit,
					totalPages: Math.ceil((total?.count || 0) / limit),
				},
			});
		} catch (error) {
			console.error("Error fetching gift history:", error);
			res.status(500).json({ error: "Failed to fetch gift history" });
		}
	}

	async getGiftSticker(req: Request, res: Response) {
		try {
			const giftId = req.params.id;

			const gift = await this.db.get<Gift>(
				"SELECT file_id, thumbnail_file_id, thumb_file_id FROM gifts WHERE telegram_id = ?",
				giftId
			);

			if (!gift) {
				return res.status(404).json({ error: "Gift not found" });
			}

			try {
				const response = await axios.get(
					`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`,
					{
						params: {
							file_id: gift.file_id,
						},
					}
				);

				if (response.data.ok) {
					const filePath = response.data.result.file_path;
					const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

					res.json({
						file_url: fileUrl,
						thumbnail_file_id: gift.thumbnail_file_id,
						thumb_file_id: gift.thumb_file_id,
					});
				} else {
					res.status(400).json({ error: "Failed to get sticker file" });
				}
			} catch (error) {
				console.error("Telegram API error:", error);
				res
					.status(500)
					.json({ error: "Failed to fetch sticker from Telegram" });
			}
		} catch (error) {
			console.error("Error getting gift sticker:", error);
			res.status(500).json({ error: "Failed to get sticker information" });
		}
	}
}
