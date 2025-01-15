import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const execPromise = promisify(exec);

export class ConverterService {
	private readonly tempDir: string;

	constructor() {
		this.tempDir = path.join(os.tmpdir(), "tgs-converter");
		this.initTempDir();
	}

	private async initTempDir() {
		try {
			await fs.mkdir(this.tempDir, { recursive: true });
		} catch (error) {
			console.error("Error creating temp directory:", error);
		}
	}

	private async cleanup(files: string[]) {
		for (const file of files) {
			try {
				await fs.unlink(file);
			} catch (error) {
				console.error(`Error deleting ${file}:`, error);
			}
		}
	}

	async convertTgsToPng(tgsBuffer: Buffer): Promise<Buffer> {
		const id = uuidv4();
		const tgsPath = path.join(this.tempDir, `${id}.tgs`);
		const jsonPath = path.join(this.tempDir, `${id}.json`);
		const pngPath = path.join(this.tempDir, `${id}.png`);

		try {
			await fs.writeFile(tgsPath, tgsBuffer);

			await execPromise(`gzip -d -f < "${tgsPath}" > "${jsonPath}"`);

			await execPromise(
				`npx puppeteer-lottie -i "${jsonPath}" -o "${pngPath}"`
			);

			const pngBuffer = await sharp(pngPath)
				.png({
					quality: 100,
					compressionLevel: 9,
				})
				.toBuffer();

			const metadata = await sharp(pngBuffer).metadata();
			if (!metadata.width || !metadata.height) {
				throw new Error("Invalid image generated");
			}

			return pngBuffer;
		} catch (error) {
			console.error("Conversion error:", error);
			throw new Error("Failed to convert TGS to PNG");
		} finally {
			await this.cleanup([tgsPath, jsonPath, pngPath]);
		}
	}
}
