// src/services/image.service.ts
import mongoose from "mongoose";
import { Readable } from "stream";
import axios from "axios";
import { logger } from "../utils/logger";
import { PassThrough } from "stream";
import sharp from "sharp";

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

	private async downloadImageStream(url: string): Promise<Buffer> {
		try {
			const response = await axios({
				method: "GET",
				url: url,
				responseType: "arraybuffer",
				timeout: 10000,
			});
			return Buffer.from(response.data);
		} catch (error) {
			logger.error(`Failed to download image from ${url}: ${error}`);
			throw new Error(`Failed to download image: ${error}`);
		}
	}

	private async compressImageAggressively(
		imageBuffer: Buffer
	): Promise<Buffer> {
		try {
			logger.info(
				`Original image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`
			);

			const metadata = await sharp(imageBuffer).metadata();
			logger.info(
				`Image dimensions: ${metadata.width}x${metadata.height}, format: ${metadata.format}`
			);

			let pipeline = sharp(imageBuffer);

			if (metadata.width && metadata.width > 300) {
				logger.info(`Resizing image to 300px width`);
				pipeline = pipeline.resize(300);
			}

			const compressedBuffer = await pipeline
				.png({
					compressionLevel: 9,
					adaptiveFiltering: true,
					palette: true,
					quality: 5,
					effort: 10,
					colors: 64,
				})
				.toBuffer();

			logger.info(
				`Compressed image size: ${(compressedBuffer.length / 1024).toFixed(
					2
				)} KB`
			);
			logger.info(
				`Compression ratio: ${Math.round(
					(1 - compressedBuffer.length / imageBuffer.length) * 100
				)}%`
			);

			return compressedBuffer;
		} catch (error) {
			logger.error(`Failed to compress image with Sharp: ${error}`);
			return imageBuffer;
		}
	}

	private bufferToStream(buffer: Buffer): Readable {
		const stream = new PassThrough();
		stream.end(buffer);
		return stream;
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
				logger.info(
					`Image for ${giftName}-${modelName} already exists with id ${existingFile._id}`
				);
				return existingFile._id.toString();
			}

			logger.info(`Downloading image from URL: ${imageUrl}`);
			const imageBuffer = await this.downloadImageStream(imageUrl);

			const compressedBuffer = await this.compressImageAggressively(
				imageBuffer
			);

			const imageStream = this.bufferToStream(compressedBuffer);

			const uploadStream = this.getBucket().openUploadStream(
				`${giftName}-${modelName}`,
				{
					metadata: {
						giftName,
						modelName,
						uploadDate: new Date(),
						contentType: "image/png",
						compressed: true,
						originalSize: imageBuffer.length,
						compressedSize: compressedBuffer.length,
						compressionRatio: Math.round(
							(1 - compressedBuffer.length / imageBuffer.length) * 100
						),
					},
				}
			);

			await new Promise<void>((resolve, reject) => {
				imageStream
					.pipe(uploadStream)
					.on("error", reject)
					.on("finish", resolve);
			});

			const compressionPercent = Math.round(
				(1 - compressedBuffer.length / imageBuffer.length) * 100
			);
			logger.success(
				`Successfully saved image for ${giftName} - ${modelName} with id ${uploadStream.id} (compressed by ${compressionPercent}%)`
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
				logger.warning(`Image ${imageId} not found in database`);
				return null;
			}

			const downloadStream = this.getBucket().openDownloadStream(
				new mongoose.Types.ObjectId(imageId)
			);

			return {
				stream: downloadStream,
				contentType: file.metadata?.contentType || "image/png",
			};
		} catch (error) {
			logger.error(`Failed to get image ${imageId}: ${error}`);
			return null;
		}
	}

	public async deleteImage(imageId: string): Promise<boolean> {
		try {
			await this.getBucket().delete(new mongoose.Types.ObjectId(imageId));
			logger.info(`Successfully deleted image ${imageId}`);
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

			if (!file) {
				logger.info(`No image found for ${giftName}-${modelName}`);
				return null;
			}

			logger.info(
				`Found image for ${giftName}-${modelName} with id ${file._id}`
			);
			return file._id.toString();
		} catch (error) {
			logger.error(
				`Failed to get image for ${giftName} - ${modelName}: ${error}`
			);
			return null;
		}
	}
}

export const imageService = ImageService.getInstance();
