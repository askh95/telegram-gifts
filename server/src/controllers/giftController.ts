import { Request, Response } from "express";
import { Pool } from "pg";
import { fetchGifts } from "../services/telegramService";
import { Gift, TelegramGiftResponse } from "../models/Gift";
import { AnalyticsService } from "../services/analyticsService";
import moment from "moment";

interface HistoryRecord {
	remaining_count: number;
	total_count: number;
	change_amount: number;
	last_updated: string;
	emoji: string;
	formatted_last_updated: string;
}

interface GiftWithFormattedDate extends Gift {
	formatted_last_updated: string;
}
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
	private pool: Pool;
	private analyticsService: AnalyticsService;

	constructor(pool: Pool) {
		this.pool = pool;
		this.analyticsService = new AnalyticsService(pool);
	}

	async updateGifts() {
		try {
			const { rows: activeGifts } = await this.pool.query<ExistingGift>(
				"SELECT telegram_id, remaining_count, total_count FROM gifts WHERE status = 'active'"
			);

			const currentGifts = await fetchGifts();
			const currentGiftIds = new Set(
				currentGifts.map((g: TelegramGiftResponse) => g.id)
			);

			for (const activeGift of activeGifts) {
				if (!currentGiftIds.has(activeGift.telegram_id)) {
					console.log(
						`Gift ${activeGift.telegram_id} disappeared from API, marking as sold out`
					);

					await this.pool.query(
						`UPDATE gifts 
                        SET status = 'sold_out',
                            remaining_count = 0,
                            last_updated = NOW()
                        WHERE telegram_id = $1`,
						[activeGift.telegram_id]
					);

					await this.pool.query(
						`INSERT INTO gifts_history (
                            telegram_id,
                            remaining_count,
                            total_count,
                            change_amount,
                            last_updated
                        ) VALUES ($1, $2, $3, $4, NOW())`,
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
						await this.pool.query(
							`UPDATE gifts 
                            SET remaining_count = $1,
                                last_updated = NOW()
                            WHERE telegram_id = $2`,
							[gift.remaining_count, gift.id]
						);

						await this.pool.query(
							`INSERT INTO gifts_history (
                                telegram_id,
                                remaining_count,
                                total_count,
                                change_amount,
                                last_updated
                            ) VALUES ($1, $2, $3, $4, NOW())`,
							[
								gift.id,
								gift.remaining_count,
								gift.total_count,
								existingGift.remaining_count - gift.remaining_count,
							]
						);
					}
				} else {
					await this.pool.query(
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
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW())`,
						[
							gift.id,
							gift.sticker.custom_emoji_id,
							gift.sticker.emoji,
							gift.sticker.file_id,
							gift.sticker.file_size,
							gift.sticker.file_unique_id,
							gift.sticker.height,
							gift.sticker.width,
							gift.sticker.is_animated,
							gift.sticker.is_video,
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

					await this.pool.query(
						`INSERT INTO gifts_history (
                            telegram_id,
                            remaining_count,
                            total_count,
                            change_amount,
                            last_updated
                        ) VALUES ($1, $2, $3, $4, NOW())`,
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
			let paramCounter = 1;

			if (req.query.status) {
				baseQuery += ` AND status = $${paramCounter++}`;
				params.push(req.query.status);
			}

			if (req.query.minStars) {
				baseQuery += ` AND star_count >= $${paramCounter++}`;
				params.push(parseInt(req.query.minStars));
			}
			if (req.query.maxStars) {
				baseQuery += ` AND star_count <= $${paramCounter++}`;
				params.push(parseInt(req.query.maxStars));
			}

			if (req.query.minRemaining) {
				baseQuery += ` AND remaining_count >= $${paramCounter++}`;
				params.push(parseInt(req.query.minRemaining));
			}
			if (req.query.maxRemaining) {
				baseQuery += ` AND remaining_count <= $${paramCounter++}`;
				params.push(parseInt(req.query.maxRemaining));
			}

			const queryWithSort = `${baseQuery} 
                ORDER BY 
                    CASE 
                        WHEN status = 'sold_out' THEN 2
                        ELSE 1 
                    END,
                    remaining_count ASC`;

			const finalQuery = `${queryWithSort} LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;

			const [giftsResult, totalResult] = await Promise.all([
				this.pool.query<Gift>(finalQuery, [...params, limit, offset]),
				this.pool.query<{ count: string }>(
					`SELECT COUNT(*) as count FROM (${baseQuery}) AS subquery`,
					params
				),
			]);

			res.json({
				data: giftsResult.rows,
				pagination: {
					total: parseInt(totalResult.rows[0].count),
					page,
					limit,
					totalPages: Math.ceil(parseInt(totalResult.rows[0].count) / limit),
				},
			});
		} catch (error) {
			console.error("Error fetching all gifts:", error);
			res.status(500).json({ error: "Failed to fetch gifts" });
		}
	}

	async getGiftById(req: Request, res: Response) {
		try {
			const [giftResult, lastPurchaseResult] = await Promise.all([
				this.pool.query<GiftWithFormattedDate>(
					`SELECT 
                        telegram_id,
                        custom_emoji_id,
                        emoji,
                        star_count,
                        remaining_count,
                        total_count,
                        status,
                        to_char(last_updated AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00"') as formatted_last_updated
                    FROM gifts 
                    WHERE telegram_id = $1`,
					[req.params.id]
				),
				this.pool.query(
					`SELECT 
                        change_amount,
                        to_char(last_updated AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00"') as last_purchase
                    FROM gifts_history 
                    WHERE telegram_id = $1 AND change_amount > 0
                    ORDER BY last_updated DESC 
                    LIMIT 1`,
					[req.params.id]
				),
			]);

			if (giftResult.rows.length === 0) {
				return res.status(404).json({ error: "Gift not found" });
			}

			const gift = giftResult.rows[0];
			const lastPurchase = lastPurchaseResult.rows[0];

			res.json({
				...gift,
				last_purchase: lastPurchase?.last_purchase || null,
				last_purchase_amount: lastPurchase?.change_amount || 0,
				last_updated: gift.formatted_last_updated,
			});
		} catch (error) {
			console.error("Error fetching gift by ID:", error);
			res.status(500).json({ error: "Failed to fetch gift details" });
		}
	}

	async getGiftStats(req: Request, res: Response) {
		try {
			const giftId = req.params.id;

			const {
				rows: [result],
			} = await this.pool.query(
				`
                WITH gift_data AS (
                    SELECT 
                        g.*,
                        to_char(g.last_updated AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00"') as formatted_last_updated
                    FROM gifts g 
                    WHERE g.telegram_id = $1
                ),
                hourly_stats AS (
                    SELECT 
                        date_trunc('hour', gh.last_updated AT TIME ZONE 'UTC') as hour,
                        COALESCE(SUM(gh.change_amount), 0)::INTEGER as purchase_count
                    FROM gifts_history gh
                    WHERE 
                        gh.telegram_id = $1 
                        AND gh.last_updated >= NOW() AT TIME ZONE 'UTC' - interval '24 hours'
                    GROUP BY date_trunc('hour', gh.last_updated AT TIME ZONE 'UTC')
                ),
                latest_prediction AS (
                    SELECT 
                        predicted_sold_out_date,
                        confidence,
                        prediction_data,
                        created_at
                    FROM gift_predictions
                    WHERE gift_id = $1
                    ORDER BY created_at DESC
                    LIMIT 1
                ),
                purchase_stats AS (
                    SELECT 
                        MIN(last_updated) as first_update,
                        COALESCE(SUM(CASE 
                            WHEN last_updated >= NOW() - interval '24 hours' 
                            THEN change_amount 
                            ELSE 0 
                        END), 0)::INTEGER as purchases_24h
                    FROM gifts_history
                    WHERE telegram_id = $1 AND change_amount > 0
                )
                SELECT 
                    g.*,
                    p.*,
                    lp.predicted_sold_out_date,
                    lp.confidence,
                    lp.prediction_data,
                    lp.created_at as prediction_created_at,
                    json_agg(
                        json_build_object(
                            'hour', to_char(h.hour AT TIME ZONE 'UTC', 'HH24:00'),
                            'count', h.purchase_count
                        ) ORDER BY h.hour
                    ) as hourly_data
                FROM gift_data g
                CROSS JOIN purchase_stats p
                LEFT JOIN latest_prediction lp ON true
                LEFT JOIN hourly_stats h ON true
                GROUP BY 
                    g.telegram_id, g.custom_emoji_id, g.emoji, g.file_id, 
                    g.file_size, g.file_unique_id, g.height, g.width,
                    g.is_animated, g.is_video, g.star_count, g.remaining_count,
                    g.total_count, g.status, g.thumbnail_file_id, 
                    g.thumbnail_file_unique_id, g.thumbnail_file_size,
                    g.thumbnail_width, g.thumbnail_height, g.thumb_file_id,
                    g.thumb_file_unique_id, g.thumb_file_size, g.thumb_width,
                    g.thumb_height, g.last_updated, g.formatted_last_updated,
                    p.first_update, p.purchases_24h, lp.predicted_sold_out_date,
                    lp.confidence, lp.prediction_data, lp.created_at
            `,
				[giftId]
			);

			if (!result) {
				return res.status(404).json({ error: "Gift not found" });
			}

			const hourlyStats = result.hourly_data.filter(
				(stat: any) => stat.count > 0
			);
			let peakHour = { hour: "00:00", count: 0 };
			for (const stat of hourlyStats) {
				if (stat.count > peakHour.count) {
					peakHour = stat;
				}
			}

			const total24hPurchases = hourlyStats.reduce(
				(sum: number, stat: any) => sum + stat.count,
				0
			);

			const hoursToCount = Math.min(
				24,
				Math.max(1, moment().diff(moment(result.first_update), "hours"))
			);
			const currentRate = Math.round(result.purchases_24h / hoursToCount);

			const response = {
				gift_id: giftId,
				current_count: result.remaining_count,
				total_count: result.total_count,
				status: result.status,
				analytics: {
					peak_hour: {
						hour: peakHour.hour,
						count: peakHour.count,
					},
					purchase_rate: currentRate,
					prediction: result.predicted_sold_out_date
						? {
								remaining: result.remaining_count,
								predicted_sold_out: result.predicted_sold_out_date,
								confidence: result.confidence,
								avg_hourly_rate: Math.round(total24hPurchases / 24),
								total_purchases_24h: total24hPurchases,
						  }
						: null,
					hourly_stats: hourlyStats,
				},
				last_updated: result.formatted_last_updated,
			};

			res.json(response);

			// Асинхронно обновляем прогноз если нужно
			if (
				!result.prediction_created_at ||
				moment(result.prediction_created_at).isBefore(
					moment().subtract(30, "minutes")
				)
			) {
				this.analyticsService.updatePrediction(giftId).catch(console.error);
			}
		} catch (error) {
			console.error("Error getting gift stats:", error);
			res.status(500).json({
				error: "Failed to fetch gift statistics",
				details: error instanceof Error ? error.message : "Unknown error",
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
                    to_char(h.last_updated, 'YYYY-MM-DD"T"HH24:MI:SS.MSOF') as formatted_last_updated,
                    g.emoji
                FROM gifts_history h
                JOIN gifts g ON g.telegram_id = h.telegram_id
                WHERE h.telegram_id = $1
            `;

			const params: any[] = [giftId];
			let paramCounter = 2;

			if (startDate) {
				query += ` AND h.last_updated >= $${paramCounter++}`;
				params.push(startDate);
			}
			if (endDate) {
				query += ` AND h.last_updated <= $${paramCounter++}`;
				params.push(endDate);
			}
			if (minChange !== undefined) {
				query += ` AND h.change_amount >= $${paramCounter++}`;
				params.push(minChange);
			}
			if (maxChange !== undefined) {
				query += ` AND h.change_amount <= $${paramCounter++}`;
				params.push(maxChange);
			}

			const [historyResult, totalResult] = await Promise.all([
				this.pool.query<HistoryRecord>(
					query +
						` 
                    ORDER BY h.last_updated DESC
                    LIMIT $${paramCounter++} OFFSET $${paramCounter++}`,
					[...params, limit, (page - 1) * limit]
				),
				this.pool.query<{ count: string }>(
					`SELECT COUNT(*) as count FROM (${query}) as subquery`,
					params
				),
			]);

			if (historyResult.rows.length === 0) {
				return res
					.status(404)
					.json({ error: "No history found for this gift" });
			}

			const formattedData = historyResult.rows.map((record) => ({
				remaining_count: record.remaining_count,
				total_count: record.total_count,
				change_amount: record.change_amount,
				emoji: record.emoji,
				last_updated: record.formatted_last_updated,
			}));

			res.json({
				data: formattedData,
				pagination: {
					total: parseInt(totalResult.rows[0].count),
					page,
					limit,
					totalPages: Math.ceil(parseInt(totalResult.rows[0].count) / limit),
				},
			});
		} catch (error) {
			console.error("Error fetching gift history:", error);
			res.status(500).json({ error: "Failed to fetch gift history" });
		}
	}
}
