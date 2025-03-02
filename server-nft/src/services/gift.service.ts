// src/services/gift.service.ts
import config from "../config/config";
import { Gift, GiftHistory } from "../models/gift.model";
import { GiftApiResponse, IGiftOwner, IGiftModel } from "../models/types";
import { logger } from "../utils/logger";
import { sleep } from "../utils/helpers";
import { telegramService } from "./telegramService";
import mongoose from "mongoose";
import { ImageUtils } from "../utils/image.utils";
import axios from "axios";

export class GiftService {
	private static instance: GiftService;
	private isUpdating: boolean = false;
	private knownTypes: Set<string> = new Set();

	private constructor() {}

	public static getInstance(): GiftService {
		if (!GiftService.instance) {
			GiftService.instance = new GiftService();
		}
		return GiftService.instance;
	}

	public async init(): Promise<void> {
		await this.loadKnownTypes();
		logger.info(
			`Loaded ${this.knownTypes.size} known gift types from database`
		);
	}

	private async loadKnownTypes(): Promise<void> {
		const types = await Gift.distinct("name");
		this.knownTypes = new Set(types);
	}

	public async checkForNewTypes(): Promise<string[]> {
		const configTypes = Object.values(config.gifts.types);

		if (this.knownTypes.size === 0) {
			await this.loadKnownTypes();
		}

		const newTypes = configTypes.filter((type) => !this.knownTypes.has(type));

		return newTypes;
	}

	private getTypeIdByName(typeName: string): string | null {
		const entry = Object.entries(config.gifts.types).find(
			([_, name]) => name === typeName
		);

		return entry ? entry[0] : null;
	}

	public async updateGiftType(typeName: string): Promise<void> {
		if (this.isUpdating) {
			logger.warning(
				`Update already in progress, skipping update for ${typeName}...`
			);
			return;
		}

		const typeId = this.getTypeIdByName(typeName);
		if (!typeId) {
			logger.error(`Cannot find type ID for ${typeName}`);
			return;
		}

		this.isUpdating = true;
		const newVersion = Date.now();

		try {
			logger.info(`🎁 Starting update for new gift type: ${typeName}`);

			const existingGift = await Gift.findOne({ name: typeName });
			if (existingGift) {
				const historyRecord = {
					...existingGift.toObject(),
					_id: new mongoose.Types.ObjectId(),
					version: existingGift.version || 1,
					replacedAt: new Date(),
					replacedBy: newVersion,
				};
				await GiftHistory.create(historyRecord);
				logger.info(`Archived existing version of ${typeName} to history`);
			}

			const initialGift = await this.fetchGiftData(typeName, 1);
			if (!initialGift) {
				logger.warning(
					`Could not fetch initial gift data for ${typeName}, skipping`
				);
				this.isUpdating = false;
				return;
			}

			const totalIssued = initialGift.issued;
			logger.info(`Found ${totalIssued} total gifts for ${typeName}`);

			const giftData: GiftApiResponse[] = [];
			const batchSize = 50;

			for (let i = 1; i <= totalIssued; i += batchSize) {
				const batchEnd = Math.min(i + batchSize - 1, totalIssued);
				logger.progress(i, totalIssued, `Processing ${typeName} batch`);

				const promises = Array.from({ length: batchEnd - i + 1 }, (_, index) =>
					this.fetchGiftData(typeName, i + index)
				);

				const batchResults = await Promise.all(promises);
				const validResults = batchResults.filter(
					(gift): gift is GiftApiResponse => gift !== null
				);

				giftData.push(...validResults);
				await sleep(1000);
			}

			const uniquePatterns = new Set<string>();
			const uniqueBackdrops = new Set<string>();

			giftData.forEach((gift) => {
				if (gift.pattern) uniquePatterns.add(gift.pattern);
				if (gift.backdrop) uniqueBackdrops.add(gift.backdrop);
			});

			const modelMap = await this.processGiftModel(typeName, giftData);
			const giftModels = Array.from(modelMap.values());

			await Gift.findOneAndUpdate(
				{ name: typeName },
				{
					name: typeName,
					issued: totalIssued,
					total: initialGift.total,
					modelsCount: giftModels.length,
					models: giftModels,
					availablePatterns: Array.from(uniquePatterns),
					availableBackdrops: Array.from(uniqueBackdrops),
					version: newVersion,
					lastUpdated: new Date(),
				},
				{ upsert: true }
			);

			await this.cleanupOldVersions(typeName, 3);

			this.knownTypes.add(typeName);

			logger.success(`✅ ${typeName} update complete`);
		} catch (error) {
			logger.error(`Error updating gift type ${typeName}: ${error}`);
		} finally {
			this.isUpdating = false;
		}
	}

	public async shouldUpdate(
		skipAfterNewTypeUpdate: boolean = false
	): Promise<boolean> {
		const newTypes = await this.checkForNewTypes();
		if (newTypes.length > 0) {
			logger.info(
				`Found ${newTypes.length} new gift types: ${newTypes.join(", ")}`
			);
			return true;
		}

		if (skipAfterNewTypeUpdate) {
			logger.info("Skipping full update since new types were just updated");
			return false;
		}

		const latestGift = await Gift.findOne(
			{},
			{},
			{ sort: { lastUpdated: -1 } }
		);

		if (!latestGift) {
			return true;
		}

		const timeSinceLastUpdate = Date.now() - latestGift.lastUpdated.getTime();
		const updateIntervalMs = 24 * 60 * 60 * 1000;

		return timeSinceLastUpdate > updateIntervalMs;
	}

	private async fetchGiftData(
		giftType: string,
		number: number
	): Promise<GiftApiResponse | null> {
		try {
			const formattedGiftType = giftType.replace(/\s+/g, "");

			const response = await telegramService.getGiftData(
				formattedGiftType,
				number
			);
			if (!response) return null;

			const giftResponse: GiftApiResponse = {
				owner: response.owner,
				ownerName: response.ownerName,
				ownerAddress: response.ownerAddress,
				num: response.num,
				model: response.model,
				pattern: response.pattern,
				backdrop: response.backdrop,
				slug: response.slug,
				issued: response.issued,
				total: response.total,
			};

			return giftResponse;
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to fetch ${giftType} #${number}: ${error.message}`
				);
			} else {
				logger.error(`Failed to fetch ${giftType} #${number}: Unknown error`);
			}
			return null;
		}
	}

	private getDisplayName(giftData: GiftApiResponse): string {
		if (giftData.owner) {
			return giftData.owner.displayName;
		}
		if (giftData.ownerName) {
			return giftData.ownerName;
		}
		if (giftData.ownerAddress) {
			return giftData.ownerAddress;
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
					blockchainAddress: owner.blockchainAddress,
					giftDetails: [],
				});
			}

			const existingOwner = ownerMap.get(key)!;
			existingOwner.giftsCount += owner.giftsCount;

			owner.giftNumbers.forEach((giftNumber, index) => {
				existingOwner.giftNumbers.push(giftNumber);

				if (owner.giftDetails && owner.giftDetails.length > 0) {
					const detail = owner.giftDetails.find((d) => d.number === giftNumber);
					if (detail) {
						existingOwner.giftDetails!.push(detail);
					} else {
						existingOwner.giftDetails!.push({
							number: giftNumber,
							pattern: owner.pattern || "Unknown",
							backdrop: owner.backdrop || "Unknown",
						});
					}
				} else {
					existingOwner.giftDetails!.push({
						number: giftNumber,
						pattern: owner.pattern || "Unknown",
						backdrop: owner.backdrop || "Unknown",
					});
				}
			});

			if (owner.username) {
				existingOwner.username = owner.username;
			}

			if (!owner.isHidden) {
				existingOwner.isHidden = false;
			}

			if (owner.ownerName && !existingOwner.username) {
				existingOwner.ownerName = owner.ownerName;
			}
		});

		return Array.from(ownerMap.values());
	}

	private async processGiftModel(
		giftType: string,
		giftData: GiftApiResponse[]
	): Promise<Map<string, IGiftModel>> {
		const modelMap = new Map<string, IGiftModel>();

		for (const gift of giftData) {
			if (!modelMap.has(gift.model)) {
				modelMap.set(gift.model, {
					name: gift.model,
					ownersCount: 0,
					owners: [],
				});

				const imageUrl = await ImageUtils.downloadImage(giftType, gift.model);
				if (imageUrl) {
					const model = modelMap.get(gift.model)!;
					model.imageUrl = imageUrl;
				}
			}

			const model = modelMap.get(gift.model)!;
			const displayName = this.getDisplayName(gift);

			const newOwner: IGiftOwner = {
				displayName,
				username: gift.owner?.username
					? `t.me/${gift.owner.username}`
					: undefined,
				ownerName: gift.ownerName || undefined,
				blockchainAddress: gift.ownerAddress || undefined,
				giftsCount: 1,
				giftNumbers: [gift.num],
				isHidden: !gift.owner,
				modelName: gift.model,
				pattern: gift.pattern,
				backdrop: gift.backdrop,
				giftDetails: [
					{
						number: gift.num,
						pattern: gift.pattern,
						backdrop: gift.backdrop,
					},
				],
			};

			model.owners.push(newOwner);
		}

		for (const model of modelMap.values()) {
			model.owners = this.mergeOwnerData(model.owners);
			model.ownersCount = model.owners.length;
		}

		return modelMap;
	}

	public async getModelImage(
		giftName: string,
		modelName: string
	): Promise<string | null> {
		try {
			const gift = await Gift.findOne({ name: giftName });
			if (!gift) return null;

			const model = gift.models.find((m) => m.name === modelName);
			if (!model) return null;

			if (!model.imageUrl) {
				const imageUrl = await ImageUtils.downloadImage(giftName, modelName);
				if (imageUrl) {
					model.imageUrl = imageUrl;
					await gift.save();
				}
			}

			return model.imageUrl || null;
		} catch (error) {
			logger.error(`Error getting model image: ${error}`);
			return null;
		}
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

	private async cleanupOldVersions(
		giftName: string,
		keepCount: number = 3
	): Promise<void> {
		try {
			const historyRecords = await GiftHistory.find({ name: giftName }).sort({
				replacedAt: -1,
			});

			if (historyRecords.length > keepCount) {
				const recordsToDelete = historyRecords.slice(keepCount);
				const idsToDelete = recordsToDelete.map((record) => record._id);

				const deleteResult = await GiftHistory.deleteMany({
					_id: { $in: idsToDelete },
				});

				logger.info(
					`Cleaned up ${deleteResult.deletedCount} old history records for ${giftName}, keeping the latest ${keepCount}`
				);
			}
		} catch (error) {
			logger.error(`Error cleaning up old versions for ${giftName}: ${error}`);
		}
	}

	public async updateGifts(skipRecentlyUpdated: boolean = true): Promise<void> {
		if (this.isUpdating) {
			logger.warning("Update already in progress, skipping...");
			return;
		}

		this.isUpdating = true;
		const newVersion = Date.now();
		const startTime = new Date();
		const recentlyUpdatedTypes = new Set<string>();

		try {
			const newTypes = await this.checkForNewTypes();
			if (newTypes.length > 0) {
				logger.info(
					`Found ${newTypes.length} new gift types: ${newTypes.join(", ")}`
				);

				for (const typeName of newTypes) {
					const typeId = this.getTypeIdByName(typeName);
					if (!typeId) {
						logger.warning(
							`Could not find ID for new type: ${typeName}, skipping`
						);
						continue;
					}

					await this.updateGiftType(typeName);
					this.knownTypes.add(typeName);
					recentlyUpdatedTypes.add(typeName);
				}
			}

			let giftTypes: [string, string][] = [];
			try {
				const response = await axios.get(config.api.giftIdsUrl);

				if (response.data && typeof response.data === "object") {
					giftTypes = Object.entries(response.data);
					logger.info(`Fetched ${giftTypes.length} gift types from API`);
				} else {
					logger.warning("Invalid response from gift IDs API, using defaults");
					giftTypes = Object.entries(config.gifts.types);
				}
			} catch (error) {
				logger.error(`Failed to fetch gift types from API: ${error}`);
				giftTypes = Object.entries(config.gifts.types);
			}

			logger.info("Starting regular gift data update for all types...");

			const existingGifts = await Gift.find({});
			if (existingGifts.length > 0) {
				await this.archiveCurrentVersion(newVersion);
			}

			if (!skipRecentlyUpdated) {
				recentlyUpdatedTypes.clear();
			}

			for (const [id, type] of giftTypes) {
				if (recentlyUpdatedTypes.has(type)) {
					logger.info(`Skipping ${type} as it was recently updated`);
					continue;
				}

				logger.info(
					`🎁 Updating ${type} (${giftTypes.indexOf([id, type]) + 1}/${
						giftTypes.length
					})`
				);

				const initialGift = await this.fetchGiftData(type, 1);
				if (!initialGift) {
					logger.warning(
						`Could not fetch initial gift data for ${type}, skipping`
					);
					continue;
				}

				const totalIssued = initialGift.issued;
				logger.info(`Found ${totalIssued} total gifts for ${type}`);

				const giftData: GiftApiResponse[] = [];
				const batchSize = 50;

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

				const uniquePatterns = new Set<string>();
				const uniqueBackdrops = new Set<string>();

				giftData.forEach((gift) => {
					if (gift.pattern) uniquePatterns.add(gift.pattern);
					if (gift.backdrop) uniqueBackdrops.add(gift.backdrop);
				});

				const modelMap = await this.processGiftModel(type, giftData);
				const giftModels = Array.from(modelMap.values());

				await Gift.findOneAndUpdate(
					{ name: type },
					{
						name: type,
						issued: totalIssued,
						total: initialGift.total,
						modelsCount: giftModels.length,
						models: giftModels,
						availablePatterns: Array.from(uniquePatterns),
						availableBackdrops: Array.from(uniqueBackdrops),
						version: newVersion,
						lastUpdated: new Date(),
					},
					{ upsert: true }
				);

				await this.cleanupOldVersions(type, 3);

				this.knownTypes.add(type);

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

	public async getGiftsList(page: number = 1, limit: number = 20) {
		try {
			const totalItems = await Gift.countDocuments({});
			const totalPages = Math.ceil(totalItems / limit);
			const startIndex = (page - 1) * limit;

			const gifts = await Gift.find(
				{},
				{
					name: 1,
					issued: 1,
					total: 1,
					modelsCount: 1,
					version: 1,
					lastUpdated: 1,
				}
			)
				.sort({ name: 1 })
				.skip(startIndex)
				.limit(limit);

			return {
				pagination: {
					currentPage: page,
					totalPages,
					limit,
					totalItems,
				},
				gifts,
			};
		} catch (error) {
			logger.error(`Error in getGiftsList: ${error}`);
			throw error;
		}
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
		limit: number = 50,
		search?: string
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
						pattern: owner.pattern,
						backdrop: owner.backdrop,
					});
				}
			});
		});

		owners.sort((a, b) => b.giftsCount - a.giftsCount);

		owners.forEach((owner, index) => {
			owner.position = index + 1;
		});

		let filteredOwners = owners;
		if (search) {
			const searchLower = search.toLowerCase();
			filteredOwners = owners.filter(
				(owner) =>
					owner.displayName.toLowerCase().includes(searchLower) ||
					owner.username?.toLowerCase().includes(searchLower)
			);
		}

		const totalOwners = filteredOwners.length;
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const paginatedOwners = filteredOwners.slice(startIndex, endIndex);

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

	public async getGiftPatterns(name: string): Promise<string[]> {
		const gift = await Gift.findOne({ name });
		if (!gift || !gift.availablePatterns) return [];
		return gift.availablePatterns.sort((a, b) => a.localeCompare(b));
	}

	public async getGiftBackdrops(name: string): Promise<string[]> {
		const gift = await Gift.findOne({ name });
		if (!gift || !gift.availableBackdrops) return [];
		return gift.availableBackdrops.sort((a, b) => a.localeCompare(b));
	}

	public async getGiftModelNames(name: string): Promise<string[]> {
		const gift = await Gift.findOne({ name });
		if (!gift) return [];

		const modelNames = gift.models.map((model) => model.name);
		return [...new Set(modelNames)].sort((a, b) => a.localeCompare(b));
	}

	public async searchGifts(params: {
		name?: string;
		model?: string;
		pattern?: string;
		backdrop?: string;
		page?: number;
		limit?: number;
	}) {
		const { name, model, pattern, backdrop, page = 1, limit = 20 } = params;

		if (!name) {
			return {
				pagination: {
					currentPage: page,
					totalPages: 0,
					limit,
					totalItems: 0,
				},
				results: [],
			};
		}

		const gift = await Gift.findOne({ name });
		if (!gift) {
			return {
				pagination: {
					currentPage: page,
					totalPages: 0,
					limit,
					totalItems: 0,
				},
				results: [],
			};
		}

		const results: Array<{
			giftNumber: number;
			owner: string;
			username?: string;
			model: string;
			pattern: string;
			backdrop: string;
		}> = [];

		for (const giftModel of gift.models) {
			if (model && giftModel.name !== model) continue;

			for (const owner of giftModel.owners) {
				if (owner.giftDetails && owner.giftDetails.length > 0) {
					for (const detail of owner.giftDetails) {
						if (pattern && detail.pattern !== pattern) continue;
						if (backdrop && detail.backdrop !== backdrop) continue;

						results.push({
							giftNumber: detail.number,
							owner: owner.displayName,
							username: owner.username,
							model: giftModel.name,
							pattern: detail.pattern,
							backdrop: detail.backdrop,
						});
					}
				} else {
					if (pattern && owner.pattern !== pattern) continue;
					if (backdrop && owner.backdrop !== backdrop) continue;

					for (const giftNumber of owner.giftNumbers) {
						results.push({
							giftNumber,
							owner: owner.displayName,
							username: owner.username,
							model: giftModel.name,
							pattern: owner.pattern || "Unknown",
							backdrop: owner.backdrop || "Unknown",
						});
					}
				}
			}
		}

		results.sort((a, b) => a.giftNumber - b.giftNumber);

		const totalItems = results.length;
		const totalPages = Math.ceil(totalItems / limit);
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;

		return {
			pagination: {
				currentPage: page,
				totalPages,
				limit,
				totalItems,
			},
			results: results.slice(startIndex, endIndex),
		};
	}
}

export const giftService = GiftService.getInstance();
