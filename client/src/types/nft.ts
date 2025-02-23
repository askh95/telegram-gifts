// src/types/nft.ts
export interface NFTGift {
	_id: string;
	name: string;
	issued: number;
	total: number;
	modelsCount: number;
	version: number;
	lastUpdated: string;
}

export interface Owner {
	username: string;
	displayName: string;
	giftsCount: number;
	giftNumbers: number[];
	isHidden: boolean;
	modelName?: string;
	position?: number;
}

export interface Model {
	name: string;
	ownersCount: number;
	totalGifts: number;
	imageUrl?: string;
}

export interface ModelOwner extends Owner {
	modelName: string;
}

export interface PaginatedResponse<T> {
	pagination: {
		currentPage: number;
		totalPages: number;
		limit: number;
		totalOwners?: number;
		totalModels?: number;
		totalUsers?: number;
	};
	owners?: T[];
	models?: T[];
	users?: T[];
	modelInfo?: Model;
}
