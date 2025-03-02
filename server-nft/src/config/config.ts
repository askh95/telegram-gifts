// src/config/config.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
	mongodb: {
		uri: process.env.MONGODB_URI || "mongodb://localhost:27017/gift-tracker",
	},
	api: {
		updateInterval: "0 */24 * * *",
		giftIdsUrl: "пустышка а не ссылка, забиваем пока",
	},
	gifts: {
		types: {
			"5936085638515261992": "SignetRing",
			"5933671725160989227": "PreciousPeach",
			"5915521180483191380": "DurovsCap",
			"5868659926187901653": "LootBag",
			"5915550639663874519": "LoveCandle",
		},
	},
};

export default config;
