// src/components/GiftVisualizer.tsx
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import {
	selectGift,
	selectModel,
	selectPattern,
	selectBackdrop,
	selectModelLottie,
	selectPatternLottie,
	selectBackdropData,
	setModelLottie,
	setPatternLottie,
	setBackdropData,
} from "../store/slices/nftVisualizerSlice";
import {
	useGetModelLottieQuery,
	useGetPatternLottieQuery,
	useGetBackdropDataQuery,
} from "../store/api/nftSearch";
import { Loader } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";
import SafeLottie from "./SafeLottie";

type PatternPosition = {
	top?: string;
	bottom?: string;
	left?: string;
	right?: string;
	width: string;
	height: string;
	opacity: string;
	translateX?: string;
	translateY?: string;
};

const GiftVisualizer = () => {
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState(false);

	const selectedGift = useAppSelector(selectGift);
	const selectedModel = useAppSelector(selectModel);
	const selectedPattern = useAppSelector(selectPattern);
	const selectedBackdrop = useAppSelector(selectBackdrop);
	const modelLottie = useAppSelector(selectModelLottie);
	const patternLottie = useAppSelector(selectPatternLottie);
	const backdropData = useAppSelector(selectBackdropData);

	const { data: fetchedModelLottie, isLoading: isModelLoading } =
		useGetModelLottieQuery(
			{ giftName: selectedGift || "", modelName: selectedModel || "" },
			{ skip: !selectedGift || !selectedModel }
		);

	const { data: fetchedPatternLottie, isLoading: isPatternLoading } =
		useGetPatternLottieQuery(
			{ giftName: selectedGift || "", patternName: selectedPattern || "" },
			{ skip: !selectedGift || !selectedPattern }
		);

	const { data: fetchedBackdropData, isLoading: isBackdropLoading } =
		useGetBackdropDataQuery(selectedGift || "", { skip: !selectedGift });

	useEffect(() => {
		if (fetchedModelLottie) {
			dispatch(setModelLottie(fetchedModelLottie));
		}
	}, [fetchedModelLottie, dispatch]);

	useEffect(() => {
		if (fetchedPatternLottie) {
			dispatch(setPatternLottie(fetchedPatternLottie));
		}
	}, [fetchedPatternLottie, dispatch]);

	useEffect(() => {
		if (fetchedBackdropData && selectedBackdrop) {
			const selectedBackdropData = fetchedBackdropData.find(
				(backdrop) => backdrop.name === selectedBackdrop
			);
			if (selectedBackdropData) {
				dispatch(setBackdropData(selectedBackdropData));
			}
		}
	}, [fetchedBackdropData, selectedBackdrop, dispatch]);

	useEffect(() => {
		setIsLoading(isModelLoading || isPatternLoading || isBackdropLoading);
	}, [isModelLoading, isPatternLoading, isBackdropLoading]);

	const getBackgroundStyle = () => {
		if (!selectedGift) {
			return {};
		}

		if (!backdropData) {
			return {
				background: "rgba(0, 0, 0, 0.05)",
			};
		}

		const { centerColor, edgeColor } = backdropData.hex;
		return {
			background: `radial-gradient(circle, ${centerColor} 20%, ${edgeColor} 80%)`,
		};
	};

	const patternPositions: PatternPosition[] = [
		{ top: "10%", left: "10%", width: "10%", height: "10%", opacity: "15" },
		{ top: "10%", right: "10%", width: "10%", height: "10%", opacity: "15" },
		{ bottom: "10%", left: "10%", width: "10%", height: "10%", opacity: "15" },
		{ bottom: "10%", right: "10%", width: "10%", height: "10%", opacity: "15" },

		{
			top: "50%",
			left: "5%",
			width: "8%",
			height: "8%",
			opacity: "15",
			translateY: "-50%",
		},
		{
			top: "50%",
			right: "5%",
			width: "8%",
			height: "8%",
			opacity: "15",
			translateY: "-50%",
		},
		{
			top: "5%",
			left: "50%",
			width: "8%",
			height: "8%",
			opacity: "15",
			translateX: "-50%",
		},
		{
			bottom: "5%",
			left: "50%",
			width: "8%",
			height: "8%",
			opacity: "15",
			translateX: "-50%",
		},

		{ top: "12%", left: "30%", width: "7%", height: "7%", opacity: "15" },
		{ top: "12%", right: "30%", width: "7%", height: "7%", opacity: "15" },
		{ bottom: "12%", left: "30%", width: "7%", height: "7%", opacity: "15" },
		{ bottom: "12%", right: "30%", width: "7%", height: "7%", opacity: "15" },

		{ top: "30%", left: "12%", width: "7%", height: "7%", opacity: "15" },
		{ bottom: "30%", left: "12%", width: "7%", height: "7%", opacity: "15" },
		{ top: "30%", right: "12%", width: "7%", height: "7%", opacity: "15" },
		{ bottom: "30%", right: "12%", width: "7%", height: "7%", opacity: "15" },

		{ bottom: "25%", left: "25%", width: "6%", height: "6%", opacity: "10" },
		{ bottom: "25%", right: "25%", width: "6%", height: "6%", opacity: "10" },
	];

	if (!selectedGift) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-center p-6">
					<div className="text-gray-500 text-lg">
						Выберите подарок для предпросмотра
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full relative">
			<div className="absolute inset-0 aspect-square">
				<div
					className="absolute inset-0 z-0 transition-all duration-300"
					style={getBackgroundStyle()}
				/>

				<div className="absolute inset-0 z-10 flex items-center justify-center">
					{isLoading ? (
						<div className="flex items-center justify-center">
							<Loader className="w-8 h-8 text-gray-400 animate-spin" />
						</div>
					) : (
						<div className="relative w-full h-full">
							{patternLottie && (
								<div className="absolute inset-0 z-20">
									<ErrorBoundary
										fallback={
											<div className="text-gray-500 text-sm">
												Ошибка загрузки узора
											</div>
										}
									>
										<div className="w-full h-full relative overflow-hidden">
											{patternPositions.map((pos, index) => (
												<div
													key={index}
													className="absolute"
													style={{
														top: pos.top,
														bottom: pos.bottom,
														left: pos.left,
														right: pos.right,
														width: pos.width,
														height: pos.height,
														opacity: `0.${pos.opacity}`,
														transform: `${
															pos.translateX
																? `translateX(${pos.translateX})`
																: ""
														} ${
															pos.translateY
																? `translateY(${pos.translateY})`
																: ""
														}`.trim(),
													}}
												>
													<SafeLottie
														animationData={patternLottie}
														className="w-full h-full"
													/>
												</div>
											))}
										</div>
									</ErrorBoundary>
								</div>
							)}

							{modelLottie && (
								<div className="absolute inset-0 z-30 flex items-center justify-center">
									<ErrorBoundary
										fallback={
											<div className="text-gray-500 text-sm">
												Ошибка загрузки модели
											</div>
										}
									>
										<div className="w-3/5 h-3/5">
											<SafeLottie
												animationData={modelLottie}
												className="w-full h-full"
											/>
										</div>
									</ErrorBoundary>
								</div>
							)}
						</div>
					)}
				</div>

				<div
					className="absolute inset-0 z-40 pointer-events-none"
					// style={{
					// 	background:
					// 		"linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)",
					// }}
				/>
			</div>
		</div>
	);
};

export default GiftVisualizer;
