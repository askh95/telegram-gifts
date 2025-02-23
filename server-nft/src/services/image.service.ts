// src/services/image.service.ts
import mongoose from "mongoose";
import { Readable } from "stream";
import axios from "axios";
import { logger } from "../utils/logger";

export class ImageService {
	private static instance: ImageService;
	private bucket: mongoose.mongo.GridFSBucket | null = null;

	private constructor() {}

	public static getInstance(): ImageService {
		if (!ImageService.instance) {
			ImageService.instance = new ImageService();
		}
		return ImageService.instance;
	}

	public async init(): Promise<void> {
		if (!mongoose.connection.db) {
			throw new Error("Database connection not established");
		}
		this.bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
			bucketName: "images",
		});
	}

	private getBucket(): mongoose.mongo.GridFSBucket {
		if (!this.bucket) {
			throw new Error("ImageService not initialized");
		}
		return this.bucket;
	}

	private async downloadImageStream(url: string): Promise<Readable> {
		const response = await axios({
			method: "GET",
			url: url,
			responseType: "stream",
		});
		return response.data;
	}

	public async saveImage(
		imageUrl: string,
		giftName: string,
		modelName: string
	): Promise<string> {
		try {
			if (!mongoose.connection.db) {
				throw new Error("Database connection not established");
			}

			const existingFile = await mongoose.connection.db
				.collection("images.files")
				.findOne({
					"metadata.giftName": giftName,
					"metadata.modelName": modelName,
				});

			if (existingFile) {
				return existingFile._id.toString();
			}

			const imageStream = await this.downloadImageStream(imageUrl);
			const uploadStream = this.getBucket().openUploadStream(
				`${giftName}-${modelName}`,
				{
					metadata: {
						giftName,
						modelName,
						uploadDate: new Date(),
						contentType: "image/png",
					},
				}
			);

			await new Promise((resolve, reject) => {
				imageStream
					.pipe(uploadStream)
					.on("error", reject)
					.on("finish", resolve);
			});

			logger.info(
				`Successfully saved image for ${giftName} - ${modelName} with id ${uploadStream.id}`
			);
			return uploadStream.id.toString();
		} catch (error) {
			logger.error(
				`Failed to save image for ${giftName} - ${modelName}: ${error}`
			);
			throw error;
		}
	}

	public async getImage(imageId: string): Promise<{
		stream: Readable;
		contentType: string;
	} | null> {
		try {
			if (!mongoose.connection.db) {
				throw new Error("Database connection not established");
			}

			const file = await mongoose.connection.db
				.collection("images.files")
				.findOne({ _id: new mongoose.Types.ObjectId(imageId) });

			if (!file) {
				return null;
			}

			const downloadStream = this.getBucket().openDownloadStream(
				new mongoose.Types.ObjectId(imageId)
			);

			return {
				stream: downloadStream,
				contentType: "image/png",
			};
		} catch (error) {
			logger.error(`Failed to get image ${imageId}: ${error}`);
			return null;
		}
	}

	public async deleteImage(imageId: string): Promise<boolean> {
		try {
			await this.getBucket().delete(new mongoose.Types.ObjectId(imageId));
			return true;
		} catch (error) {
			logger.error(`Failed to delete image ${imageId}: ${error}`);
			return false;
		}
	}

	public async getImageByGiftAndModel(
		giftName: string,
		modelName: string
	): Promise<string | null> {
		try {
			if (!mongoose.connection.db) {
				throw new Error("Database connection not established");
			}

			const file = await mongoose.connection.db
				.collection("images.files")
				.findOne({
					"metadata.giftName": giftName,
					"metadata.modelName": modelName,
				});

			return file ? file._id.toString() : null;
		} catch (error) {
			logger.error(
				`Failed to get image for ${giftName} - ${modelName}: ${error}`
			);
			return null;
		}
	}
}

export const imageService = ImageService.getInstance();
