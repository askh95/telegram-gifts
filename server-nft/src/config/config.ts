// src/config/config.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
	mongodb: {
		uri: process.env.MONGODB_URI || "mongodb://localhost:27017/gift-tracker",
	},
	api: {
		updateInterval: "0 */3 * * *",
	},
	gifts: {
		types: {
			"5897593557492957738": "Top Hat",
			"5868659926187901653": "LootBag",
			"5868348541058942091": "LovePotion",
			"5868220813026526561": "ToyBear",
			"5868503709637411929": "DiamondRing",
		},
	},
};

export default config;
