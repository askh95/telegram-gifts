// src/models/types.ts
export interface GiftApiResponse {
	owner: {
		id: number;
		displayName: string;
		username: string | null;
	} | null;
	ownerName?: string | null;
	ownerAddress?: string | null;
	num: number;
	model: string;
	pattern: string;
	backdrop: string;
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
	position?: number;
	modelName?: string;
	pattern?: string;
	backdrop?: string;
	blockchainAddress?: string;
	models?: Array<{
		name: string;
		count: number;
	}>;

	giftDetails?: Array<{
		number: number;
		pattern: string;
		backdrop: string;
	}>;
}

export interface IGiftModel {
	name: string;
	ownersCount: number;
	owners: IGiftOwner[];
	imageUrl?: string;
}

export interface IGift {
	name: string;
	issued: number;
	total: number;
	modelsCount: number;
	models: IGiftModel[];
	version: number;
	lastUpdated: Date;
	availablePatterns: string[];
	availableBackdrops: string[];
}

export interface IGiftHistory extends IGift {
	replacedAt: Date;
	replacedBy: number;
}
