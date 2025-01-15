import { Pool } from "pg";
import moment from "moment";

export interface PredictionResult {
	predicted_sold_out_date: string | null;
	confidence: number;
	prediction_data: string;
	created_at?: string;
}

export interface PurchaseStats {
	purchaseRate: number;
	peakHour: string;
	peakCount: number;
	hourlyStats: Array<{ hour: string; count: number }>;
	totalPurchases: number;
	averagePurchaseSize: number;
	purchaseTrend: "increasing" | "decreasing" | "stable";
}

export class AnalyticsService {
	private pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
		this.initializeTables();
	}

	private async initializeTables() {
		await this.pool.query(`
            CREATE TABLE IF NOT EXISTS gift_predictions (
                id SERIAL PRIMARY KEY,
                gift_id TEXT NOT NULL,
                predicted_sold_out_date TIMESTAMP,
                confidence REAL,
                prediction_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gift_id) REFERENCES gifts(telegram_id)
            )
        `);

		await this.pool.query(`
            CREATE TABLE IF NOT EXISTS gift_analytics (
                id SERIAL PRIMARY KEY,
                gift_id TEXT NOT NULL,
                total_purchases INTEGER,
                average_purchase_size REAL,
                peak_hour INTEGER,
                peak_purchase_count INTEGER,
                purchase_rate REAL,
                trend TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gift_id) REFERENCES gifts(telegram_id)
            )
        `);
	}

	async getPurchaseStats(giftId: string): Promise<PurchaseStats> {
		const { rows: purchaseHistory } = await this.pool.query(
			`SELECT 
                last_updated at time zone 'UTC' as timestamp,
                remaining_count,
                total_count,
                change_amount
            FROM gifts_history 
            WHERE telegram_id = $1
                AND last_updated >= NOW() - INTERVAL '24 hours'
            ORDER BY last_updated ASC`,
			[giftId]
		);

		const hourlyPurchases = this.groupPurchasesByHour(purchaseHistory);
		const peakHour = this.findPeakPurchaseHour(hourlyPurchases);
		const currentPurchaseRate = await this.calculateCurrentPurchaseRate(giftId);

		const totalPurchases = purchaseHistory.reduce(
			(sum, record) => sum + (record.change_amount || 0),
			0
		);

		const averagePurchaseSize = totalPurchases / purchaseHistory.length || 0;
		const trend = this.calculatePurchaseTrend(purchaseHistory);

		await this.saveAnalytics(giftId, {
			totalPurchases,
			averagePurchaseSize,
			peakHour: parseInt(peakHour.hour),
			peakCount: peakHour.count,
			purchaseRate: currentPurchaseRate,
			trend,
		});

		return {
			purchaseRate: currentPurchaseRate,
			peakHour: peakHour.hour,
			peakCount: peakHour.count,
			hourlyStats: hourlyPurchases,
			totalPurchases,
			averagePurchaseSize,
			purchaseTrend: trend,
		};
	}

	public async getLatestPrediction(
		giftId: string
	): Promise<PredictionResult | null> {
		const { rows } = await this.pool.query<PredictionResult>(
			`SELECT 
                predicted_sold_out_date,
                confidence,
                prediction_data,
                created_at
            FROM gift_predictions
            WHERE gift_id = $1
            ORDER BY created_at DESC
            LIMIT 1`,
			[giftId]
		);

		return rows[0] || null;
	}

	public async updatePrediction(
		giftId: string
	): Promise<PredictionResult | null> {
		try {
			const prediction = await this.calculatePrediction(giftId);
			await this.savePrediction(giftId, prediction);
			return prediction;
		} catch (error) {
			console.error("Error updating prediction:", error);
			return null;
		}
	}

	private async calculatePrediction(giftId: string): Promise<PredictionResult> {
		try {
			const [
				{ rows: history },
				{
					rows: [currentGift],
				},
			] = await Promise.all([
				this.pool.query(
					`SELECT 
                        last_updated at time zone 'UTC' as timestamp,
                        remaining_count,
                        change_amount
                    FROM gifts_history 
                    WHERE telegram_id = $1 
                        AND last_updated >= NOW() - INTERVAL '24 hours'
                        AND change_amount > 0
                    ORDER BY last_updated ASC`,
					[giftId]
				),
				this.pool.query(
					`SELECT remaining_count, total_count
                    FROM gifts 
                    WHERE telegram_id = $1`,
					[giftId]
				),
			]);

			if (!currentGift || history.length < 2) {
				return {
					predicted_sold_out_date: null,
					confidence: 0,
					prediction_data: JSON.stringify({
						error: "Insufficient data for prediction",
					}),
				};
			}

			const totalSold = history.reduce(
				(sum, record) => sum + record.change_amount,
				0
			);
			const timeStart = moment(history[0].timestamp);
			const timeEnd = moment(history[history.length - 1].timestamp);
			const hoursElapsed = Math.max(1, timeEnd.diff(timeStart, "hours", true));

			const baseHourlyRate = totalSold / hoursElapsed;

			const recentHistory = history.slice(-6);
			const recentRate = this.calculateRecentRate(recentHistory);

			const weightedRate = baseHourlyRate * 0.7 + recentRate * 0.3;

			const hourlyFactors = this.calculateHourlyFactors(history);
			const currentHour = moment().hour();
			const adjustedRate = weightedRate * (hourlyFactors[currentHour] || 1);

			const remainingCount = currentGift.remaining_count;
			const hoursRemaining = Math.ceil(remainingCount / adjustedRate);

			const confidence = this.calculateConfidence({
				historyLength: history.length,
				hourlyVariation: this.calculateHourlyVariation(history),
				trendStability: this.calculateTrendStability(history),
				remainingPercentage: remainingCount / currentGift.total_count,
			});

			const predictedSoldOut = moment()
				.add(hoursRemaining, "hours")
				.format("YYYY-MM-DD[T]HH:mm:ss.SSS[+00]");

			return {
				predicted_sold_out_date: predictedSoldOut,
				confidence,
				prediction_data: JSON.stringify({
					base_rate: baseHourlyRate,
					recent_rate: recentRate,
					weighted_rate: weightedRate,
					adjusted_rate: adjustedRate,
					remaining_count: remainingCount,
					hours_remaining: hoursRemaining,
					hourly_factors: hourlyFactors,
				}),
			};
		} catch (error) {
			console.error("Prediction calculation error:", error);
			return {
				predicted_sold_out_date: null,
				confidence: 0,
				prediction_data: JSON.stringify({
					error: "Prediction calculation failed",
				}),
			};
		}
	}

	private calculateRecentRate(history: any[]): number {
		if (history.length < 2) return 0;

		const recentSales = history.reduce(
			(sum, record) => sum + record.change_amount,
			0
		);
		const timeSpan = moment(history[history.length - 1].timestamp).diff(
			moment(history[0].timestamp),
			"hours",
			true
		);

		return timeSpan > 0 ? recentSales / timeSpan : 0;
	}

	private calculateHourlyFactors(history: any[]): { [hour: number]: number } {
		const hourlyTotals: { [hour: number]: number } = {};
		const hourlyCounts: { [hour: number]: number } = {};

		history.forEach((record) => {
			const hour = moment(record.timestamp).hour();
			hourlyTotals[hour] = (hourlyTotals[hour] || 0) + record.change_amount;
			hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
		});

		const hourlyAverages: { [hour: number]: number } = {};
		Object.keys(hourlyTotals).forEach((hour) => {
			const numHour = parseInt(hour);
			hourlyAverages[numHour] = hourlyTotals[numHour] / hourlyCounts[numHour];
		});

		const avgValue =
			Object.values(hourlyAverages).reduce((sum, val) => sum + val, 0) /
			Object.values(hourlyAverages).length;

		const factors: { [hour: number]: number } = {};
		Object.keys(hourlyAverages).forEach((hour) => {
			const numHour = parseInt(hour);
			factors[numHour] = hourlyAverages[numHour] / avgValue;
		});

		return factors;
	}

	private calculateConfidence(params: {
		historyLength: number;
		hourlyVariation: number;
		trendStability: number;
		remainingPercentage: number;
	}): number {
		const {
			historyLength,
			hourlyVariation,
			trendStability,
			remainingPercentage,
		} = params;

		let baseConfidence = Math.min(1, historyLength / 24);

		const variationFactor = 1 - Math.min(1, hourlyVariation);

		const stabilityFactor = Math.min(1, trendStability);

		const remainingFactor = 1 - Math.min(1, remainingPercentage);

		const confidence =
			baseConfidence * 0.3 +
			variationFactor * 0.3 +
			stabilityFactor * 0.2 +
			remainingFactor * 0.2;

		return Math.max(0, Math.min(1, confidence));
	}

	private calculateHourlyVariation(history: any[]): number {
		const hourlyMap = new Map<number, number>();

		history.forEach((record) => {
			const hour = moment(record.timestamp).hour();
			hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + record.change_amount);
		});

		const values = Array.from(hourlyMap.values());
		if (values.length === 0) return 1;

		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
			values.length;

		return Math.min(1, Math.sqrt(variance) / avg);
	}

	private calculateTrendStability(history: any[]): number {
		if (history.length < 4) return 0;

		const rates: number[] = [];
		for (let i = 1; i < history.length; i++) {
			const timeDiff = moment(history[i].timestamp).diff(
				moment(history[i - 1].timestamp),
				"hours",
				true
			);
			if (timeDiff > 0) {
				rates.push(history[i].change_amount / timeDiff);
			}
		}

		if (rates.length < 3) return 0;

		const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
		const variance =
			rates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) /
			rates.length;

		return 1 / (1 + Math.sqrt(variance) / avgRate);
	}

	private async saveAnalytics(
		giftId: string,
		data: {
			totalPurchases: number;
			averagePurchaseSize: number;
			peakHour: number;
			peakCount: number;
			purchaseRate: number;
			trend: string;
		}
	) {
		await this.pool.query(
			`INSERT INTO gift_analytics (
                gift_id,
                total_purchases,
                average_purchase_size,
                peak_hour,
                peak_purchase_count,
                purchase_rate,
                trend,
                last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (gift_id) DO UPDATE SET
                total_purchases = EXCLUDED.total_purchases,
                average_purchase_size = EXCLUDED.average_purchase_size,
                peak_hour = EXCLUDED.peak_hour,
                peak_purchase_count = EXCLUDED.peak_purchase_count,
                purchase_rate = EXCLUDED.purchase_rate,
                trend = EXCLUDED.trend,
                last_updated = CURRENT_TIMESTAMP`,
			[
				giftId,
				data.totalPurchases,
				data.averagePurchaseSize,
				data.peakHour,
				data.peakCount,
				data.purchaseRate,
				data.trend,
			]
		);
	}

	private async savePrediction(giftId: string, prediction: PredictionResult) {
		await this.pool.query(
			`INSERT INTO gift_predictions (
                gift_id,
                predicted_sold_out_date,
                confidence,
                prediction_data,
                created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
			[
				giftId,
				prediction.predicted_sold_out_date,
				prediction.confidence,
				prediction.prediction_data,
			]
		);
	}

	private groupPurchasesByHour(
		history: any[]
	): Array<{ hour: string; count: number }> {
		const hourlyMap = new Map<string, number>();

		for (let i = 0; i < 24; i++) {
			const hour = i.toString().padStart(2, "0") + ":00";
			hourlyMap.set(hour, 0);
		}

		for (let i = 1; i < history.length; i++) {
			const hour = moment(history[i].timestamp).format("HH:00");
			const purchaseCount =
				history[i - 1].remaining_count - history[i].remaining_count;

			if (purchaseCount > 0) {
				hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + purchaseCount);
			}
		}

		return Array.from(hourlyMap.entries())
			.map(([hour, count]) => ({ hour, count }))
			.sort((a, b) => a.hour.localeCompare(b.hour));
	}

	private findPeakPurchaseHour(
		hourlyStats: Array<{ hour: string; count: number }>
	) {
		return hourlyStats.reduce(
			(peak, current) => (current.count > peak.count ? current : peak),
			{ hour: "00:00", count: 0 }
		);
	}

	private async calculateCurrentPurchaseRate(giftId: string): Promise<number> {
		const { rows } = await this.pool.query(
			`WITH recent_changes AS (
                SELECT 
                    remaining_count,
                    last_updated,
                    LAG(remaining_count) OVER (ORDER BY last_updated) as prev_count,
                    LAG(last_updated) OVER (ORDER BY last_updated) as prev_updated
                FROM gifts_history
                WHERE telegram_id = $1
                AND last_updated >= NOW() - INTERVAL '6 hours'
                ORDER BY last_updated DESC
            )
            SELECT 
                SUM(prev_count - remaining_count) as total_change,
                MAX(last_updated) - MIN(last_updated) as time_span
            FROM recent_changes
            WHERE prev_count IS NOT NULL`,
			[giftId]
		);

		const result = rows[0];
		if (!result?.total_change || !result?.time_span) return 0;

		const hours = moment.duration(result.time_span).asHours();
		return hours > 0 ? result.total_change / hours : 0;
	}

	private calculatePurchaseTrend(
		history: any[]
	): "increasing" | "decreasing" | "stable" {
		if (history.length < 6) return "stable";

		const partSize = Math.floor(history.length / 3);
		const parts = [
			history.slice(0, partSize),
			history.slice(partSize, partSize * 2),
			history.slice(partSize * 2),
		];

		const rates = parts.map((part) => {
			if (part.length < 2) return 0;
			const timeDiff = moment(part[part.length - 1].timestamp).diff(
				moment(part[0].timestamp),
				"hours",
				true
			);
			const salesDiff =
				part[0].remaining_count - part[part.length - 1].remaining_count;
			return timeDiff > 0 ? salesDiff / timeDiff : 0;
		});

		const threshold = 0.15;
		const firstChange = (rates[1] - rates[0]) / rates[0];
		const secondChange = (rates[2] - rates[1]) / rates[1];

		if (firstChange > threshold && secondChange > threshold) {
			return "increasing";
		} else if (firstChange < -threshold && secondChange < -threshold) {
			return "decreasing";
		}

		return "stable";
	}

	public async getHighPriorityGifts() {
		try {
			const { rows } = await this.pool.query(`
                WITH recent_analytics AS (
                    SELECT DISTINCT ON (gift_id)
                        gift_id,
                        purchase_rate,
                        trend,
                        last_updated
                    FROM gift_analytics
                    WHERE last_updated >= NOW() - INTERVAL '1 hour'
                    ORDER BY gift_id, last_updated DESC
                ),
                recent_predictions AS (
                    SELECT DISTINCT ON (gift_id)
                        gift_id,
                        predicted_sold_out_date,
                        confidence
                    FROM gift_predictions
                    WHERE created_at >= NOW() - INTERVAL '1 hour'
                    ORDER BY gift_id, created_at DESC
                )
                SELECT 
                    g.telegram_id,
                    g.emoji,
                    g.remaining_count,
                    g.total_count,
                    rp.predicted_sold_out_date,
                    rp.confidence,
                    ra.purchase_rate,
                    ra.trend
                FROM gifts g
                JOIN recent_analytics ra ON g.telegram_id = ra.gift_id
                LEFT JOIN recent_predictions rp ON g.telegram_id = rp.gift_id
                WHERE g.status = 'active'
                    AND (
                        (rp.predicted_sold_out_date IS NOT NULL 
                         AND rp.predicted_sold_out_date <= NOW() + INTERVAL '24 hours')
                        OR
                        (g.remaining_count <= g.total_count * 0.1)
                        OR
                        (ra.trend = 'increasing' AND ra.purchase_rate > 0)
                    )
                ORDER BY 
                    CASE 
                        WHEN g.remaining_count <= g.total_count * 0.1 THEN 1
                        WHEN rp.predicted_sold_out_date <= NOW() + INTERVAL '12 hours' THEN 2
                        WHEN ra.trend = 'increasing' THEN 3
                        ELSE 4
                    END,
                    rp.predicted_sold_out_date NULLS LAST`);

			return rows;
		} catch (error) {
			console.error("Error getting high priority gifts:", error);
			throw error;
		}
	}

	public async getGlobalStats() {
		try {
			const {
				rows: [stats],
			} = await this.pool.query(`
                WITH recent_analytics AS (
                    SELECT DISTINCT ON (gift_id)
                        gift_id,
                        purchase_rate,
                        trend,
                        total_purchases
                    FROM gift_analytics
                    WHERE last_updated >= NOW() - INTERVAL '24 hours'
                    ORDER BY gift_id, last_updated DESC
                )
                SELECT 
                    COUNT(DISTINCT g.telegram_id) as total_gifts,
                    SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) as active_gifts,
                    SUM(CASE WHEN g.status = 'sold_out' THEN 1 ELSE 0 END) as sold_out_gifts,
                    COALESCE(AVG(NULLIF(ra.purchase_rate, 0)), 0) as avg_purchase_rate,
                    COALESCE(MAX(ra.total_purchases), 0) as max_purchases_24h,
                    COALESCE(SUM(ra.total_purchases), 0) as total_purchases_24h
                FROM gifts g
                LEFT JOIN recent_analytics ra ON g.telegram_id = ra.gift_id`);

			const { rows: trends } = await this.pool.query(`
                WITH recent_analytics AS (
                    SELECT DISTINCT ON (gift_id)
                        gift_id,
                        trend
                    FROM gift_analytics
                    WHERE last_updated >= NOW() - INTERVAL '24 hours'
                    ORDER BY gift_id, last_updated DESC
                )
                SELECT trend, COUNT(*) as count
                FROM recent_analytics
                WHERE trend IS NOT NULL
                GROUP BY trend`);

			return {
				...stats,
				trends: trends.reduce(
					(acc, { trend, count }) => ({
						...acc,
						[trend]: parseInt(count),
					}),
					{ increasing: 0, decreasing: 0, stable: 0 }
				),
			};
		} catch (error) {
			console.error("Error getting global stats:", error);
			throw error;
		}
	}

	public async cleanup() {
		try {
			await this.pool.query(`
                DELETE FROM gift_predictions
                WHERE created_at < NOW() - INTERVAL '7 days'
            `);
		} catch (error) {
			console.error("Error during cleanup:", error);
		}
	}
}
