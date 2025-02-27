import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface NFTVisualizerState {
	selectedGift: string | null;
	selectedModel: string | null;
	selectedPattern: string | null;
	selectedBackdrop: string | null;
	modelLottie: any;
	patternLottie: any;
	backdropData: any;
	isPreviewMode: boolean;
	searchQuery: {
		name: string | null;
		model: string | null;
		pattern: string | null;
		backdrop: string | null;
	};
}

const initialState: NFTVisualizerState = {
	selectedGift: null,
	selectedModel: null,
	selectedPattern: null,
	selectedBackdrop: null,
	modelLottie: null,
	patternLottie: null,
	backdropData: null,
	isPreviewMode: false,
	searchQuery: {
		name: null,
		model: null,
		pattern: null,
		backdrop: null,
	},
};

const nftVisualizerSlice = createSlice({
	name: "nftVisualizer",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<string | null>) => {
			state.selectedGift = action.payload;
			if (state.selectedGift !== action.payload) {
				state.modelLottie = null;
				state.patternLottie = null;
				state.backdropData = null;
			}
		},
		setSelectedModel: (state, action: PayloadAction<string | null>) => {
			state.selectedModel = action.payload;
			state.modelLottie = null;
		},
		setSelectedPattern: (state, action: PayloadAction<string | null>) => {
			state.selectedPattern = action.payload;
			state.patternLottie = null;
		},
		setSelectedBackdrop: (state, action: PayloadAction<string | null>) => {
			state.selectedBackdrop = action.payload;
			state.backdropData = null;
		},
		setModelLottie: (state, action: PayloadAction<any>) => {
			state.modelLottie = action.payload;
		},
		setPatternLottie: (state, action: PayloadAction<any>) => {
			state.patternLottie = action.payload;
		},
		setBackdropData: (state, action: PayloadAction<any>) => {
			state.backdropData = action.payload;
		},
		setPreviewMode: (state, action: PayloadAction<boolean>) => {
			state.isPreviewMode = action.payload;
			state.searchQuery = {
				name: state.selectedGift,
				model: state.selectedModel,
				pattern: state.selectedPattern,
				backdrop: state.selectedBackdrop,
			};
		},
		resetSearch: (state) => {
			state.selectedGift = null;
			state.selectedModel = null;
			state.selectedPattern = null;
			state.selectedBackdrop = null;
			state.modelLottie = null;
			state.patternLottie = null;
			state.backdropData = null;
			state.isPreviewMode = false;
			state.searchQuery = {
				name: null,
				model: null,
				pattern: null,
				backdrop: null,
			};
		},
	},
});

export const {
	setSelectedGift,
	setSelectedModel,
	setSelectedPattern,
	setSelectedBackdrop,
	setModelLottie,
	setPatternLottie,
	setBackdropData,
	setPreviewMode,
	resetSearch,
} = nftVisualizerSlice.actions;

// Селекторы
export const selectGift = (state: RootState) =>
	state.nftVisualizer.selectedGift;
export const selectModel = (state: RootState) =>
	state.nftVisualizer.selectedModel;
export const selectPattern = (state: RootState) =>
	state.nftVisualizer.selectedPattern;
export const selectBackdrop = (state: RootState) =>
	state.nftVisualizer.selectedBackdrop;
export const selectModelLottie = (state: RootState) =>
	state.nftVisualizer.modelLottie;
export const selectPatternLottie = (state: RootState) =>
	state.nftVisualizer.patternLottie;
export const selectBackdropData = (state: RootState) =>
	state.nftVisualizer.backdropData;
export const selectIsPreviewMode = (state: RootState) =>
	state.nftVisualizer.isPreviewMode;
export const selectSearchQuery = (state: RootState) =>
	state.nftVisualizer.searchQuery;

export default nftVisualizerSlice.reducer;
