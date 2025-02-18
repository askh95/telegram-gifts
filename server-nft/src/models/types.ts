// src/models/types.ts
export interface GiftApiResponse {
	owner: {
		id: number;
		displayName: string;
		username: string | null;
	} | null;
	ownerName?: string | null;
	num: number;
	model: string;
	slug: string;
	issued: number;
	total: number;
}

export interface IGiftOwner {
	username?: string;
	ownerName?: string;
	displayName: string;
	giftsCount: number;
	giftNumbers: number[];
	isHidden: boolean;
	modelName?: string;
	models?: Array<{
		name: string;
		count: number;
	}>;
}

export interface IGiftModel {
	name: string;
	ownersCount: number;
	owners: IGiftOwner[];
}

export interface IGift {
	name: string;
	issued: number;
	total: number;
	modelsCount: number;
	models: IGiftModel[];
	version: number;
	lastUpdated: Date;
}

export interface IGiftHistory extends IGift {
	replacedAt: Date;
	replacedBy: number;
}
