// src/services/db.service.ts
import mongoose from "mongoose";
import config from "../config/config";

export class DatabaseService {
	private static instance: DatabaseService;

	private constructor() {}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public async connect(): Promise<void> {
		try {
			await mongoose.connect(config.mongodb.uri);
			console.log("Connected to MongoDB");
		} catch (error) {
			console.error("MongoDB connection error:", error);
			process.exit(1);
		}
	}

	public async disconnect(): Promise<void> {
		try {
			await mongoose.disconnect();
			console.log("Disconnected from MongoDB");
		} catch (error) {
			console.error("MongoDB disconnection error:", error);
		}
	}
}

export const dbService = DatabaseService.getInstance();
