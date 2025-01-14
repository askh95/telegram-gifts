import { Pool } from "pg";
import * as tf from "@tensorflow/tfjs-node";
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

interface ModelCache {
	model: tf.Sequential;
	lastUpdated: Date;
	weights: tf.Tensor[];
}

export class AnalyticsService {
	private pool: Pool;
	private models: Map<string, ModelCache> = new Map();

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

		await this.pool.query(`
            CREATE TABLE IF NOT EXISTS model_weights (
                gift_id TEXT PRIMARY KEY,
                weights TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
			const modelData = await this.getOrTrainModel(giftId);
			const prediction = await this.makePrediction(giftId);
			await this.savePrediction(giftId, prediction);
			return prediction;
		} catch (error) {
			console.error("Error updating prediction:", error);
			return null;
		}
	}

	private async getOrTrainModel(giftId: string): Promise<ModelCache> {
		const cachedModel = this.models.get(giftId);

		if (
			cachedModel &&
			moment(cachedModel.lastUpdated).isAfter(moment().subtract(1, "hour"))
		) {
			return cachedModel;
		}

		const {
			rows: [savedWeights],
		} = await this.pool.query(
			`SELECT weights, updated_at
            FROM model_weights
            WHERE gift_id = $1`,
			[giftId]
		);

		if (
			savedWeights &&
			moment(savedWeights.updated_at).isAfter(moment().subtract(1, "hour"))
		) {
			const model = await this.loadModel(JSON.parse(savedWeights.weights));
			const modelCache = {
				model,
				lastUpdated: new Date(savedWeights.updated_at),
				weights: await model.getWeights(),
			};
			this.models.set(giftId, modelCache);
			return modelCache;
		}

		return await this.trainNewModel(giftId);
	}

	private async trainNewModel(giftId: string): Promise<ModelCache> {
		const { rows: history } = await this.pool.query(
			`SELECT 
                EXTRACT(EPOCH FROM last_updated) as timestamp,
                remaining_count,
                total_count,
                change_amount
            FROM gifts_history 
            WHERE telegram_id = $1
            ORDER BY last_updated ASC`,
			[giftId]
		);

		if (history.length < 24) {
			throw new Error("Insufficient data for training");
		}

		const timestamps = history.map((h) => parseInt(h.timestamp));
		const counts = history.map((h) => h.remaining_count);
		const changes = history.map((h) => h.change_amount || 0);

		const normalizedData = this.normalizeData(timestamps, counts, changes);

		const model = tf.sequential();
		model.add(
			tf.layers.dense({ units: 64, activation: "relu", inputShape: [3] })
		);
		model.add(tf.layers.dropout({ rate: 0.2 }));
		model.add(tf.layers.dense({ units: 32, activation: "relu" }));
		model.add(tf.layers.dense({ units: 1 }));

		model.compile({
			optimizer: tf.train.adam(0.001),
			loss: "meanSquaredError",
		});

		await model.fit(normalizedData.inputs, normalizedData.outputs, {
			epochs: 100,
			batchSize: 32,
			validationSplit: 0.2,
			shuffle: true,
			verbose: 0,
		});

		const weights = await model.getWeights();
		const weightsData = weights.map((w) => ({
			data: Array.from(w.dataSync()),
			shape: w.shape,
		}));

		await this.pool.query(
			`INSERT INTO model_weights (gift_id, weights, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (gift_id) DO UPDATE
            SET weights = EXCLUDED.weights, updated_at = CURRENT_TIMESTAMP`,
			[giftId, JSON.stringify(weightsData)]
		);

		const modelCache = {
			model,
			lastUpdated: new Date(),
			weights,
		};
		this.models.set(giftId, modelCache);

		return modelCache;
	}

	private async makePrediction(giftId: string): Promise<PredictionResult> {
		try {
			const { rows: history } = await this.pool.query(
				`SELECT 
                    last_updated at time zone 'UTC' as timestamp,
                    remaining_count,
                    change_amount
                FROM gifts_history 
                WHERE telegram_id = $1 
                    AND change_amount > 0
                ORDER BY last_updated ASC`,
				[giftId]
			);

			if (history.length < 2) {
				throw new Error("Insufficient data for prediction");
			}

			const totalSold = history.reduce(
				(sum, record) => sum + record.change_amount,
				0
			);
			const timeStart = new Date(history[0].timestamp);
			const timeEnd = new Date(history[history.length - 1].timestamp);
			const hoursElapsed = Math.max(
				1,
				(timeEnd.getTime() - timeStart.getTime()) / (1000 * 60 * 60)
			);

			const hourlyRate = totalSold / hoursElapsed;

			const {
				rows: [currentGift],
			} = await this.pool.query(
				`SELECT remaining_count
                FROM gifts 
                WHERE telegram_id = $1`,
				[giftId]
			);

			if (!currentGift) {
				throw new Error("Gift not found");
			}

			const hoursRemaining = Math.ceil(
				currentGift.remaining_count / hourlyRate
			);
			const predictedSoldOut = moment()
				.add(hoursRemaining, "hours")
				.format("YYYY-MM-DD[T]HH:mm:ss.SSS[+00]");

			const hourlyVariation = this.calculateHourlyVariation(history);
			const confidence = Math.max(0.7, 1 - hourlyVariation);

			return {
				predicted_sold_out_date: predictedSoldOut,
				confidence,
				prediction_data: JSON.stringify({
					total_sold: totalSold,
					hours_tracked: hoursElapsed,
					hourly_rate: hourlyRate,
					hours_remaining: hoursRemaining,
				}),
			};
		} catch (error) {
			console.error("Prediction error:", error);
			return {
				predicted_sold_out_date: null,
				confidence: 0,
				prediction_data: JSON.stringify({
					error: "Insufficient data for prediction",
				}),
			};
		}
	}

	private calculateHourlyVariation(history: any[]): number {
		const hourlyMap = new Map<number, number>();

		history.forEach((record) => {
			const hour = new Date(record.timestamp).getHours();
			hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + record.change_amount);
		});

		const values = Array.from(hourlyMap.values());
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
			values.length;

		return Math.min(1, Math.sqrt(variance) / avg);
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

	public async cleanup() {
		try {
			await this.pool.query(`
                DELETE FROM gift_predictions
                WHERE created_at < NOW() - INTERVAL '7 days'
            `);

			for (const [giftId, modelCache] of this.models.entries()) {
				if (
					moment(modelCache.lastUpdated).isBefore(moment().subtract(1, "day"))
				) {
					modelCache.weights.forEach((w) => w.dispose());
					modelCache.model.dispose();
					this.models.delete(giftId);
				}
			}
		} catch (error) {
			console.error("Error during cleanup:", error);
		}
	}

	public async getGlobalStats() {
		try {
			const {
				rows: [stats],
			} = await this.pool.query(`
                SELECT 
                    COUNT(DISTINCT g.telegram_id) as total_gifts,
                    SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) as active_gifts,
                    SUM(CASE WHEN g.status = 'sold_out' THEN 1 ELSE 0 END) as sold_out_gifts,
                    AVG(ga.purchase_rate) as avg_purchase_rate,
                    MAX(ga.peak_purchase_count) as max_peak_purchases,
                    SUM(ga.total_purchases) as total_purchases_24h
                FROM gifts g
                LEFT JOIN gift_analytics ga ON g.telegram_id = ga.gift_id
                WHERE ga.last_updated >= NOW() - INTERVAL '24 hours'
            `);

			const { rows: trends } = await this.pool.query(`
                SELECT trend, COUNT(*) as count
                FROM gift_analytics
                WHERE last_updated >= NOW() - INTERVAL '24 hours'
                GROUP BY trend
            `);

			return {
				...stats,
				trends: trends.reduce(
					(acc, { trend, count }) => ({
						...acc,
						[trend]: count,
					}),
					{}
				),
			};
		} catch (error) {
			console.error("Error getting global stats:", error);
			throw error;
		}
	}

	public async getHighPriorityGifts() {
		try {
			const { rows } = await this.pool.query(`
                SELECT 
                    g.telegram_id,
                    g.emoji,
                    g.remaining_count,
                    g.total_count,
                    gp.predicted_sold_out_date,
                    gp.confidence,
                    ga.purchase_rate
                FROM gifts g
                JOIN (
                    SELECT DISTINCT ON (gift_id)
                        gift_id,
                        predicted_sold_out_date,
                        confidence
                    FROM gift_predictions
                    ORDER BY gift_id, created_at DESC
                ) gp ON g.telegram_id = gp.gift_id
                JOIN gift_analytics ga ON g.telegram_id = ga.gift_id
                WHERE g.status = 'active'
                    AND (
                        (gp.predicted_sold_out_date IS NOT NULL 
                         AND gp.predicted_sold_out_date <= NOW() + INTERVAL '24 hours')
                        OR
                        (g.remaining_count <= g.total_count * 0.1)
                    )
                    AND gp.confidence >= 0.7
                ORDER BY 
                    CASE 
                        WHEN g.remaining_count <= g.total_count * 0.1 THEN 1
                        ELSE 2
                    END,
                    gp.predicted_sold_out_date
            `);

			return rows;
		} catch (error) {
			console.error("Error getting high priority gifts:", error);
			throw error;
		}
	}

	private groupPurchasesByHour(
		history: any[]
	): Array<{ hour: string; count: number }> {
		const hourlyMap = new Map<string, number>();

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
		const {
			rows: [result],
		} = await this.pool.query(
			`
            WITH current_count AS (
                SELECT remaining_count 
                FROM gifts 
                WHERE telegram_id = $1
            ),
            previous_count AS (
                SELECT remaining_count
                FROM gifts_history
                WHERE telegram_id = $1 
                    AND last_updated < NOW() - INTERVAL '1 hour'
                ORDER BY last_updated DESC 
                LIMIT 1
            )
            SELECT 
                current_count.remaining_count as current_count,
                previous_count.remaining_count as previous_count
            FROM current_count
            CROSS JOIN previous_count
        `,
			[giftId]
		);

		if (!result) return 0;

		const { current_count, previous_count } = result;
		return (previous_count - current_count) / 3600;
	}

	private calculatePurchaseTrend(
		history: any[]
	): "increasing" | "decreasing" | "stable" {
		if (history.length < 2) return "stable";

		const firstHalf = history.slice(0, Math.floor(history.length / 2));
		const secondHalf = history.slice(Math.floor(history.length / 2));

		const firstHalfRate = this.calculateAverageRate(firstHalf);
		const secondHalfRate = this.calculateAverageRate(secondHalf);

		const difference = secondHalfRate - firstHalfRate;
		const threshold = 0.1;

		if (difference > threshold) return "increasing";
		if (difference < -threshold) return "decreasing";
		return "stable";
	}

	private calculateAverageRate(history: any[]): number {
		if (history.length < 2) return 0;

		let totalChanges = 0;
		for (let i = 1; i < history.length; i++) {
			totalChanges +=
				history[i - 1].remaining_count - history[i].remaining_count;
		}

		const timeSpan = moment(history[history.length - 1].timestamp).diff(
			moment(history[0].timestamp),
			"hours",
			true
		);

		return timeSpan > 0 ? totalChanges / timeSpan : 0;
	}

	private async loadModel(weightsData: any[]): Promise<tf.Sequential> {
		const model = tf.sequential();
		model.add(
			tf.layers.dense({ units: 64, activation: "relu", inputShape: [3] })
		);
		model.add(tf.layers.dropout({ rate: 0.2 }));
		model.add(tf.layers.dense({ units: 32, activation: "relu" }));
		model.add(tf.layers.dense({ units: 1 }));

		model.compile({
			optimizer: tf.train.adam(0.001),
			loss: "meanSquaredError",
		});

		const weights = weightsData.map((w) => tf.tensor(w.data, w.shape));
		model.setWeights(weights);

		return model;
	}

	private normalizeData(
		timestamps: number[],
		counts: number[],
		changes: number[]
	) {
		const inputData = timestamps.map((t, i) => [t, counts[i], changes[i]]);

		const inputTensor = tf.tensor2d(inputData);
		const outputTensor = tf.tensor2d(counts, [counts.length, 1]);

		const normalizedInputs = tf.tidy(() => {
			const inputMin = inputTensor.min(0);
			const inputMax = inputTensor.max(0);
			return inputTensor.sub(inputMin).div(inputMax.sub(inputMin).add(1e-8));
		});

		const normalizedOutputs = tf.tidy(() => {
			const outputMin = outputTensor.min();
			const outputMax = outputTensor.max();
			return outputTensor
				.sub(outputMin)
				.div(outputMax.sub(outputMin).add(1e-8));
		});

		return {
			inputs: normalizedInputs,
			outputs: normalizedOutputs,
		};
	}
}
