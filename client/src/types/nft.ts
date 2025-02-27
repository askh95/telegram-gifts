// src/types/nft.ts
// Обновим интерфейс PaginatedResponse для поддержки поля 'gifts'

export interface NFTGift {
	_id: string;
	name: string;
	issued: number;
	total: number;
	modelsCount: number;
	version: number;
	lastUpdated: string;
	availablePatterns?: string[];
	availableBackdrops?: string[];
}

export interface Owner {
	username: string;
	displayName: string;
	giftsCount: number;
	giftNumbers: number[];
	isHidden: boolean;
	modelName?: string;
	position?: number;
	pattern?: string;
	backdrop?: string;
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

export interface GiftPattern {
	name: string;
	lottieJson?: any;
}

export interface GiftBackdropColor {
	centerColor: string;
	edgeColor: string;
	patternColor: string;
	textColor: string;
}

export interface GiftBackdrop {
	name: string;
	centerColor: number;
	edgeColor: number;
	patternColor: number;
	textColor: number;
	rarityPermille: number;
	hex: GiftBackdropColor;
}

export interface GiftModel {
	name: string;
	lottieJson?: any;
}

export interface SearchResult {
	giftNumber: number;
	owner: string;
	username?: string;
	model: string;
	pattern: string;
	backdrop: string;
}

export interface SearchResults {
	pagination: {
		currentPage: number;
		totalPages: number;
		limit: number;
		totalItems: number;
	};
	results: SearchResult[];
}

export interface GiftVisualization {
	giftName: string;
	modelName?: string;
	patternName?: string;
	backdropName?: string;
	modelLottie?: any;
	patternLottie?: any;
	backdropData?: GiftBackdrop;
}

export interface PaginatedResponse<T> {
	pagination: {
		currentPage: number;
		totalPages: number;
		limit: number;
		totalOwners?: number;
		totalModels?: number;
		totalItems?: number;
	};
	owners?: T[];
	models?: T[];
	users?: T[];
	gifts?: T[]; // Добавлено новое поле для списка подарков
	modelInfo?: Model;
	results?: T[];
}

export interface NftVisualizerState {
	selectedGift: string | null;
	selectedModel: string | null;
	selectedPattern: string | null;
	selectedBackdrop: string | null;
	modelLottie: any | null;
	patternLottie: any | null;
	backdropData: GiftBackdrop | null;
	isPreviewMode: boolean;
	searchQuery: {
		name: string | null;
		model: string | null;
		pattern: string | null;
		backdrop: string | null;
		page: number;
		limit: number;
	};
}
