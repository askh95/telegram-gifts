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

			const [
				{
					rows: [gift],
				},
				prediction,
			] = await Promise.all([
				this.pool.query<GiftWithFormattedDate>(
					`
              SELECT 
                *,
                to_char(last_updated AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00"') as formatted_last_updated
              FROM gifts 
              WHERE telegram_id = $1
            `,
					[giftId]
				),
				this.analyticsService.getLatestPrediction(giftId),
			]);

			if (!gift) {
				return res.status(404).json({ error: "Gift not found" });
			}

			const { rows: hourlyStats } = await this.pool.query(
				`
            WITH time_slots AS (
              SELECT 
                generate_series(
                  date_trunc('hour', NOW() AT TIME ZONE 'UTC' - interval '24 hours'),
                  date_trunc('hour', NOW() AT TIME ZONE 'UTC'),
                  interval '1 hour'
                ) AS hour
            ),
            hourly_purchases AS (
              SELECT 
                date_trunc('hour', gh.last_updated AT TIME ZONE 'UTC') as hour,
                COALESCE(SUM(gh.change_amount), 0)::INTEGER as purchase_count
              FROM gifts_history gh
              WHERE 
                gh.telegram_id = $1 
                AND gh.last_updated >= NOW() AT TIME ZONE 'UTC' - interval '24 hours'
              GROUP BY date_trunc('hour', gh.last_updated AT TIME ZONE 'UTC')
            )
            SELECT 
              to_char(ts.hour AT TIME ZONE 'UTC', 'HH24:00') as hour,
              COALESCE(hp.purchase_count, 0) as count
            FROM time_slots ts
            LEFT JOIN hourly_purchases hp ON ts.hour = hp.hour
            ORDER BY ts.hour
          `,
				[giftId]
			);

			const {
				rows: [purchaseStats],
			} = await this.pool.query(
				`
            SELECT 
              MIN(last_updated) as first_update,
              COALESCE(SUM(CASE 
                WHEN last_updated >= NOW() - interval '24 hours' 
                THEN change_amount 
                ELSE 0 
              END), 0)::INTEGER as purchases_24h
            FROM gifts_history
            WHERE telegram_id = $1 AND change_amount > 0
          `,
				[giftId]
			);

			let peakHourData = { hour: "00:00", count: 0 };
			for (const stat of hourlyStats) {
				if (stat.count > peakHourData.count) {
					peakHourData = stat;
				}
			}

			const total24hPurchases = hourlyStats.reduce(
				(sum, stat) => sum + stat.count,
				0
			);

			const hoursToCount = Math.min(
				24,
				Math.max(1, moment().diff(moment(purchaseStats.first_update), "hours"))
			);
			const currentRate = Math.round(
				purchaseStats.purchases_24h / hoursToCount
			);

			const hourlyStatsFiltered = hourlyStats
				.filter((stat) => stat.count > 0)
				.map((stat) => ({
					hour: stat.hour,
					count: stat.count,
				}));

			const response = {
				gift_id: giftId,
				current_count: gift.remaining_count,
				total_count: gift.total_count,
				status: gift.status,
				analytics: {
					peak_hour: {
						hour: peakHourData.hour,
						count: peakHourData.count,
					},
					purchase_rate: currentRate,
					prediction: prediction
						? {
								remaining: gift.remaining_count,
								predicted_sold_out: prediction.predicted_sold_out_date,
								confidence: prediction.confidence,
								avg_hourly_rate: Math.round(total24hPurchases / 24),
								total_purchases_24h: total24hPurchases,
						  }
						: null,
					hourly_stats: hourlyStatsFiltered,
				},
				last_updated: gift.formatted_last_updated,
			};

			res.json(response);

			if (
				!prediction?.created_at ||
				moment(prediction.created_at).isBefore(moment().subtract(30, "minutes"))
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
