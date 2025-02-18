// src/models/gift.model.ts
import mongoose, { Schema } from "mongoose";
import { IGift, IGiftModel, IGiftOwner, IGiftHistory } from "./types";

const GiftOwnerSchema = new Schema<IGiftOwner>({
	username: { type: String },
	ownerName: { type: String },
	displayName: { type: String, required: true },
	giftsCount: { type: Number, required: true },
	giftNumbers: [{ type: Number }],
	isHidden: { type: Boolean, default: false },
});

const GiftModelSchema = new Schema<IGiftModel>({
	name: { type: String, required: true },
	ownersCount: { type: Number, required: true },
	owners: [GiftOwnerSchema],
});

const GiftSchema = new Schema<IGift>({
	name: { type: String, required: true },
	issued: { type: Number, required: true },
	total: { type: Number, required: true },
	modelsCount: { type: Number, required: true },
	models: [GiftModelSchema],
	version: { type: Number, required: true },
	lastUpdated: { type: Date, default: Date.now },
});

const GiftHistorySchema = new Schema<IGiftHistory>({
	name: { type: String, required: true },
	issued: { type: Number, required: true },
	total: { type: Number, required: true },
	modelsCount: { type: Number, required: true },
	models: [GiftModelSchema],
	version: { type: Number, required: true },
	lastUpdated: { type: Date },
	replacedAt: { type: Date, required: true },
	replacedBy: { type: Number, required: true },
});

export const Gift = mongoose.model<IGift>("Gift", GiftSchema);
export const GiftHistory = mongoose.model<IGiftHistory>(
	"GiftHistory",
	GiftHistorySchema
);
