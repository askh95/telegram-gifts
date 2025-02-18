// src/services/gift.service.ts
import config from "../config/config";
import { Gift, GiftHistory } from "../models/gift.model";
import { GiftApiResponse, IGiftOwner, IGiftModel } from "../models/types";
import { logger } from "../utils/logger";
import { sleep } from "../utils/helpers";
import { telegramService } from "./telegramService";
import mongoose from "mongoose";

export class GiftService {
	private static instance: GiftService;
	private isUpdating: boolean = false;

	private constructor() {}

	public static getInstance(): GiftService {
		if (!GiftService.instance) {
			GiftService.instance = new GiftService();
		}
		return GiftService.instance;
	}

	private async fetchGiftData(
		giftType: string,
		number: number
	): Promise<GiftApiResponse | null> {
		try {
			return await telegramService.getGiftData(giftType, number);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to fetch ${giftType} #${number}: ${error.message}`
				);
			}
			return null;
		}
	}

	private getDisplayName(giftData: GiftApiResponse): string {
		if (giftData.owner) {
			return giftData.owner.displayName;
		}
		return giftData.ownerName || "Unknown";
	}

	private mergeOwnerData(owners: IGiftOwner[]): IGiftOwner[] {
		const ownerMap = new Map<string, IGiftOwner>();

		owners.forEach((owner) => {
			const key = owner.displayName;

			if (!ownerMap.has(key)) {
				ownerMap.set(key, {
					displayName: owner.displayName,
					giftsCount: 0,
					giftNumbers: [],
					isHidden: true,
					modelName: owner.modelName,
				});
			}

			const existingOwner = ownerMap.get(key)!;
			existingOwner.giftsCount += owner.giftsCount;
			existingOwner.giftNumbers.push(...owner.giftNumbers);

			// Если есть username, обновляем его
			if (owner.username) {
				existingOwner.username = owner.username;
			}

			// Если хотя бы один гифт не скрыт
			if (!owner.isHidden) {
				existingOwner.isHidden = false;
			}

			// Если есть ownerName и нет username
			if (owner.ownerName && !existingOwner.username) {
				existingOwner.ownerName = owner.ownerName;
			}
		});

		return Array.from(ownerMap.values());
	}

	private async processGiftModel(
		giftData: GiftApiResponse[]
	): Promise<Map<string, IGiftModel>> {
		const modelMap = new Map<string, IGiftModel>();

		giftData.forEach((gift) => {
			if (!modelMap.has(gift.model)) {
				modelMap.set(gift.model, {
					name: gift.model,
					ownersCount: 0,
					owners: [],
				});
			}

			const model = modelMap.get(gift.model)!;
			const displayName = this.getDisplayName(gift);

			const newOwner: IGiftOwner = {
				displayName,
				username: gift.owner?.username
					? `t.me/${gift.owner.username}`
					: undefined,
				ownerName: gift.ownerName || undefined,
				giftsCount: 1,
				giftNumbers: [gift.num],
				isHidden: !gift.owner,
				modelName: gift.model,
			};

			model.owners.push(newOwner);
		});

		// Объединяем владельцев для каждой модели
		for (const model of modelMap.values()) {
			model.owners = this.mergeOwnerData(model.owners);
			model.ownersCount = model.owners.length;
		}

		return modelMap;
	}

	private async archiveCurrentVersion(newVersion: number): Promise<void> {
		try {
			const currentGifts = await Gift.find({});
			logger.info(`Archiving ${currentGifts.length} current gifts to history`);

			for (const gift of currentGifts) {
				const historyRecord = {
					...gift.toObject(),
					_id: new mongoose.Types.ObjectId(),
					version: gift.version || 1,
					replacedAt: new Date(),
					replacedBy: newVersion,
				};
				await GiftHistory.create(historyRecord);
			}

			logger.success("Successfully archived current version to history");
		} catch (error) {
			logger.error(`Error archiving current version: ${error}`);
			throw error;
		}
	}

	public async shouldUpdate(): Promise<boolean> {
		const latestGift = await Gift.findOne(
			{},
			{},
			{ sort: { lastUpdated: -1 } }
		);

		if (!latestGift) {
			return true;
		}

		const timeSinceLastUpdate = Date.now() - latestGift.lastUpdated.getTime();
		const thirtyMinutesInMs = 2 * 60 * 60 * 1000; // обновление данных епта на каждые 2 часов

		return timeSinceLastUpdate > thirtyMinutesInMs;
	}

	public async updateGifts(): Promise<void> {
		if (this.isUpdating) {
			logger.warning("Update already in progress, skipping...");
			return;
		}

		this.isUpdating = true;
		const newVersion = Date.now();
		const startTime = new Date();

		try {
			const giftTypes = Object.entries(config.gifts.types);
			logger.info("Starting gift data update...");

			const existingGifts = await Gift.find({});
			if (existingGifts.length > 0) {
				await this.archiveCurrentVersion(newVersion);
			}

			for (const [id, type] of giftTypes) {
				logger.info(
					`🎁 Updating ${type} (${giftTypes.indexOf([id, type]) + 1}/${
						giftTypes.length
					})`
				);

				const initialGift = await this.fetchGiftData(type, 1);
				if (!initialGift) {
					throw new Error(`Could not fetch initial gift data for ${type}`);
				}

				const totalIssued = initialGift.issued;
				logger.info(`Found ${totalIssued} total gifts for ${type}`);

				const giftData: GiftApiResponse[] = [];
				const batchSize = 60;

				for (let i = 1; i <= totalIssued; i += batchSize) {
					const batchEnd = Math.min(i + batchSize - 1, totalIssued);
					logger.progress(i, totalIssued, `Processing ${type} batch`);

					const promises = Array.from(
						{ length: batchEnd - i + 1 },
						(_, index) => this.fetchGiftData(type, i + index)
					);

					const batchResults = await Promise.all(promises);
					const validResults = batchResults.filter(
						(gift): gift is GiftApiResponse => gift !== null
					);

					giftData.push(...validResults);
					await sleep(1000);
				}

				const modelMap = await this.processGiftModel(giftData);
				const giftModels = Array.from(modelMap.values());

				await Gift.findOneAndUpdate(
					{ name: type },
					{
						name: type,
						issued: totalIssued,
						total: initialGift.total,
						modelsCount: giftModels.length,
						models: giftModels,
						version: newVersion,
						lastUpdated: new Date(),
					},
					{ upsert: true }
				);

				logger.success(`✅ ${type} update complete`);
			}

			const duration = (new Date().getTime() - startTime.getTime()) / 1000;
			logger.success(
				`All gift types updated successfully in ${duration} seconds`
			);
		} catch (error) {
			logger.error(`Error in updateGifts: ${error}`);
			throw error;
		} finally {
			this.isUpdating = false;
		}
	}

	public async getGiftsList() {
		return Gift.find(
			{},
			{
				name: 1,
				issued: 1,
				total: 1,
				modelsCount: 1,
				version: 1,
				lastUpdated: 1,
			}
		);
	}

	public async getGiftDetails(name: string) {
		return Gift.findOne({ name });
	}

	public async getGiftModels(
		name: string,
		page: number = 1,
		limit: number = 20,
		search?: string
	) {
		const gift = await Gift.findOne({ name });
		if (!gift) return null;

		let models = gift.models.map((model) => ({
			name: model.name,
			ownersCount: model.ownersCount,
			totalGifts: model.owners.reduce(
				(sum, owner) => sum + owner.giftsCount,
				0
			),
		}));

		if (search) {
			const searchLower = search.toLowerCase();
			models = models.filter((model) =>
				model.name.toLowerCase().includes(searchLower)
			);
		}

		models.sort((a, b) => b.totalGifts - a.totalGifts);

		const totalModels = models.length;
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;

		return {
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalModels / limit),
				limit,
				totalModels,
			},
			models: models.slice(startIndex, endIndex),
		};
	}

	public async getGiftModelOwners(
		giftName: string,
		modelName: string,
		page: number = 1,
		limit: number = 50
	) {
		const gift = await Gift.findOne({ name: giftName });
		if (!gift) return null;

		const model = gift.models.find((m) => m.name === modelName);
		if (!model) return null;

		const owners = [...model.owners];
		owners.sort((a, b) => b.giftsCount - a.giftsCount);

		const totalOwners = owners.length;
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;

		return {
			modelInfo: {
				name: model.name,
				ownersCount: model.ownersCount,
				totalGifts: owners.reduce((sum, owner) => sum + owner.giftsCount, 0),
			},
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalOwners / limit),
				limit,
				totalOwners,
			},
			owners: owners.slice(startIndex, endIndex),
		};
	}

	public async getGiftOwners(
		name: string,
		page: number = 1,
		limit: number = 50
	) {
		const gift = await Gift.findOne({ name });
		if (!gift) return null;

		const owners: IGiftOwner[] = [];

		gift.models.forEach((model) => {
			model.owners.forEach((owner) => {
				const existingOwner = owners.find(
					(o) => o.displayName === owner.displayName
				);
				if (existingOwner) {
					existingOwner.giftsCount += owner.giftsCount;
					existingOwner.giftNumbers.push(...owner.giftNumbers);
					if (owner.username) existingOwner.username = owner.username;
					if (!owner.isHidden) existingOwner.isHidden = false;
				} else {
					owners.push({
						username: owner.username,
						displayName: owner.displayName,
						giftsCount: owner.giftsCount,
						giftNumbers: [...owner.giftNumbers],
						isHidden: owner.isHidden,
						modelName: "",
					});
				}
			});
		});

		owners.sort((a, b) => b.giftsCount - a.giftsCount);

		const totalOwners = owners.length;
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const paginatedOwners = owners.slice(startIndex, endIndex);

		return {
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalOwners / limit),
				limit,
				totalOwners,
			},
			owners: paginatedOwners,
		};
	}

	public async getGiftHistory(name: string, limit: number = 10) {
		return GiftHistory.find({ name }).sort({ replacedAt: -1 }).limit(limit);
	}

	public async getTopUsers(page: number = 1, limit: number = 50): Promise<any> {
		const gifts = await Gift.find({});
		const usersMap = new Map<string, any>();

		for (const gift of gifts) {
			for (const model of gift.models) {
				for (const owner of model.owners) {
					const displayName = owner.displayName;

					if (!usersMap.has(displayName)) {
						usersMap.set(displayName, {
							displayName,
							username: owner.username,
							totalGiftsCount: 0,
							giftsByType: {},
						});
					}

					const userStats = usersMap.get(displayName)!;
					userStats.totalGiftsCount += owner.giftsCount;

					if (!userStats.giftsByType[gift.name]) {
						userStats.giftsByType[gift.name] = 0;
					}
					userStats.giftsByType[gift.name] += owner.giftsCount;
				}
			}
		}

		const sortedUsers = Array.from(usersMap.values()).sort(
			(a, b) => b.totalGiftsCount - a.totalGiftsCount
		);

		const totalUsers = sortedUsers.length;
		const totalPages = Math.ceil(totalUsers / limit);
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

		return {
			pagination: {
				currentPage: page,
				totalPages,
				limit,
				totalUsers,
			},
			users: paginatedUsers,
		};
	}
}

export const giftService = GiftService.getInstance();
