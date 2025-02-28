// Обновление src/components/SearchForm.tsx для добавления подсказки
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
	selectGift,
	selectModel,
	selectPattern,
	selectBackdrop,
	setSelectedGift,
	setSelectedModel,
	setSelectedPattern,
	setSelectedBackdrop,
	setPreviewMode,
	resetSearch,
	setModelLottie,
	setPatternLottie,
	setBackdropData,
} from "../store/slices/nftVisualizerSlice";
import {
	useGetNFTGiftsQuery,
	useGetGiftModelNamesQuery,
	useGetGiftPatternsQuery,
	useGetGiftBackdropsQuery,
	useGetGiftNamesFromCDNQuery,
	useGetBackdropDataQuery,
} from "../store/api/nftSearch";
import { formatGiftName } from "../utils/formatGiftName";

import { Search } from "lucide-react";
import CustomDropdown from "./CustomDropdown";
import BackdropCircle from "./BackdropCircle";
import GiftIcon from "./GiftIcon";
import PatternIcon from "./PatternIcon";
import SearchSelectionHint from "./SearchSelectionHint";

const SearchForm = () => {
	const dispatch = useAppDispatch();

	const selectedGift = useAppSelector(selectGift);
	const selectedModel = useAppSelector(selectModel);
	const selectedPattern = useAppSelector(selectPattern);
	const selectedBackdrop = useAppSelector(selectBackdrop);

	const { data: giftsFromApi, isLoading: isGiftsLoading } =
		useGetNFTGiftsQuery();
	const { data: giftNames } = useGetGiftNamesFromCDNQuery();

	const { data: modelNames, isLoading: isModelsLoading } =
		useGetGiftModelNamesQuery(selectedGift || "", { skip: !selectedGift });

	const { data: patterns, isLoading: isPatternsLoading } =
		useGetGiftPatternsQuery(selectedGift || "", { skip: !selectedGift });

	const { data: backdrops, isLoading: isBackdropsLoading } =
		useGetGiftBackdropsQuery(selectedGift || "", { skip: !selectedGift });

	const { data: backdropData } = useGetBackdropDataQuery(selectedGift || "", {
		skip: !selectedGift,
	});

	const giftOptions = useMemo(() => {
		// @ts-ignore
		if (!giftsFromApi?.gifts || !giftNames) return [];
		// @ts-ignore
		return giftsFromApi.gifts.map((gift: any) => ({
			value: gift.name,
			label: giftNames[gift._id] || formatGiftName(gift.name),
			icon: <GiftIcon giftName={gift.name} />,
		}));
	}, [giftsFromApi, giftNames]);

	const modelOptions = useMemo(() => {
		if (!modelNames || !selectedGift) return [];

		return modelNames.map((model) => ({
			value: model,
			label: model,
			icon: (
				<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md overflow-hidden flex-shrink-0">
					<img
						src={`${
							import.meta.env.VITE_NFT_API
						}/gifts/${selectedGift}/models/${model}/image`}
						alt={model}
						className="w-full h-full object-cover"
						onError={(e) => {
							e.currentTarget.src = "/placeholder-model.png";
						}}
					/>
				</div>
			),
		}));
	}, [modelNames, selectedGift]);

	const patternOptions = useMemo(() => {
		if (!patterns || !selectedGift) return [];

		return patterns.map((pattern) => ({
			value: pattern,
			label: pattern,
			icon: <PatternIcon giftName={selectedGift} patternName={pattern} />,
		}));
	}, [patterns, selectedGift]);

	const backdropOptions = useMemo(() => {
		if (!backdrops || !backdropData) return [];

		return backdrops.map((backdrop) => {
			const backdropInfo = backdropData.find((b) => b.name === backdrop);
			const centerColor = backdropInfo?.hex?.centerColor || "#808080";
			const edgeColor = backdropInfo?.hex?.edgeColor || "#505050";

			return {
				value: backdrop,
				label: backdrop,
				icon: (
					<BackdropCircle
						centerColor={centerColor}
						edgeColor={edgeColor}
						size="medium"
					/>
				),
			};
		});
	}, [backdrops, backdropData]);

	const handleGiftChange = (value: string | null) => {
		if (value === selectedGift) {
			dispatch(setModelLottie(null));
			dispatch(setPatternLottie(null));
			dispatch(setBackdropData(null));

			dispatch(setSelectedGift(null));
			setTimeout(() => {
				dispatch(setSelectedGift(value));
			}, 50);
		} else {
			dispatch(setSelectedGift(value));
		}

		dispatch(setSelectedModel(null));
		dispatch(setSelectedPattern(null));
		dispatch(setSelectedBackdrop(null));
	};

	const handleModelChange = (value: string | null) => {
		if (value === selectedModel) {
			dispatch(setModelLottie(null));
			dispatch(setSelectedModel(null));
			setTimeout(() => {
				dispatch(setSelectedModel(value));
			}, 50);
		} else {
			dispatch(setSelectedModel(value));
		}
	};

	const handlePatternChange = (value: string | null) => {
		if (value === selectedPattern) {
			dispatch(setPatternLottie(null));
			dispatch(setSelectedPattern(null));
			setTimeout(() => {
				dispatch(setSelectedPattern(value));
			}, 50);
		} else {
			dispatch(setSelectedPattern(value));
		}
	};

	const handleBackdropChange = (value: string | null) => {
		if (value === selectedBackdrop) {
			dispatch(setBackdropData(null));
			dispatch(setSelectedBackdrop(null));
			setTimeout(() => {
				dispatch(setSelectedBackdrop(value));
			}, 50);
		} else {
			dispatch(setSelectedBackdrop(value));
		}
	};

	const handleSearch = () => {
		dispatch(setPreviewMode(true));
	};

	const handleReset = () => {
		dispatch(resetSearch());
	};

	return (
		<div className="h-full w-full flex flex-col p-6 sm:p-4 md:p-6">
			<h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 md:mb-6">
				Поиск NFT
			</h2>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 md:gap-x-4 gap-y-3 sm:gap-y-4 md:gap-y-5">
				<div>
					<label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
						Подарок
					</label>
					<CustomDropdown
						options={giftOptions}
						value={selectedGift}
						onChange={handleGiftChange}
						title="Подарок"
						placeholder="Все подарки"
						disabled={isGiftsLoading}
						loading={isGiftsLoading}
						searchable={true}
						visualModeOnMobile={true}
					/>
				</div>

				<div>
					<label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
						Модель
					</label>
					<CustomDropdown
						options={modelOptions}
						value={selectedModel}
						onChange={handleModelChange}
						title="Модель"
						placeholder="Все модели"
						disabled={!selectedGift || isModelsLoading}
						loading={isModelsLoading}
						showAllOption={true}
						allOptionLabel="Все модели"
						searchable={true}
						visualModeOnMobile={true}
					/>
				</div>

				<div>
					<label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
						Фон
					</label>
					<CustomDropdown
						options={backdropOptions}
						value={selectedBackdrop}
						onChange={handleBackdropChange}
						title="Фон"
						placeholder="Все фоны"
						disabled={!selectedGift || isBackdropsLoading}
						loading={isBackdropsLoading}
						showAllOption={true}
						allOptionLabel="Все фоны"
						searchable={true}
						visualModeOnMobile={true}
					/>
				</div>

				<div>
					<label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
						Узор
					</label>
					<CustomDropdown
						options={patternOptions}
						value={selectedPattern}
						onChange={handlePatternChange}
						title="Узор"
						placeholder="Все узоры"
						disabled={!selectedGift || isPatternsLoading}
						loading={isPatternsLoading}
						showAllOption={true}
						allOptionLabel="Все узоры"
						searchable={true}
						visualModeOnMobile={true}
					/>
				</div>
			</div>

			<SearchSelectionHint
				hasGift={selectedGift !== null}
				hasModel={selectedModel !== null}
				hasPattern={selectedPattern !== null}
				hasBackdrop={selectedBackdrop !== null}
			/>

			<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto pt-4 sm:pt-6 md:pt-8">
				<button
					onClick={handleReset}
					className="order-2 sm:order-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center gap-2 flex-1 text-sm sm:text-base"
				>
					<svg
						className="w-4 h-4 sm:w-5 sm:h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<span>Сбросить</span>
				</button>

				<button
					onClick={handleSearch}
					className={`order-1 sm:order-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-lg flex-1 text-sm sm:text-base ${
						!selectedGift ||
						(!selectedModel && !selectedPattern && !selectedBackdrop)
							? "bg-blue-600/50 hover:bg-blue-600/60"
							: "bg-blue-600 hover:bg-blue-700"
					}`}
					disabled={
						!selectedGift ||
						(!selectedModel && !selectedPattern && !selectedBackdrop)
					}
				>
					<Search className="w-4 h-4 sm:w-5 sm:h-5" />
					<span>Найти</span>
				</button>
			</div>
		</div>
	);
};

export default SearchForm;
