import { useEffect, useRef, useState } from "react";
import { Model } from "../types/nft";
import { Layers, Search, Loader } from "lucide-react";
import { ModelCard } from "./ModelCard";

interface ModelsListProps {
	models: Model[];
	giftName: string;
	onModelSelect: (modelName: string) => void;
	onSearch: (query: string) => void;
	isLoading?: boolean;
	onLoadMore: () => void;
	hasMore: boolean;
	isFetching: boolean;
}

export const ModelsList = ({
	models,
	giftName,
	onModelSelect,
	onSearch,
	isLoading = false,
	onLoadMore,
	hasMore,
	isFetching,
}: ModelsListProps) => {
	const loaderRef = useRef<HTMLDivElement>(null);
	const [searchValue, setSearchValue] = useState("");

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const firstEntry = entries[0];
				if (firstEntry.isIntersecting && hasMore && !isFetching) {
					onLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		const currentLoader = loaderRef.current;
		if (currentLoader) {
			observer.observe(currentLoader);
		}

		return () => {
			if (currentLoader) {
				observer.unobserve(currentLoader);
			}
		};
	}, [hasMore, isFetching, onLoadMore]);

	const handleSearch = (value: string) => {
		setSearchValue(value);
		onSearch(value);
	};

	return (
		<div>
			<div className="p-4 border-b border-gray-700">
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						value={searchValue}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Поиск модели..."
						className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 
                      rounded-lg text-white placeholder-gray-400 focus:outline-none 
                      focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
					/>
				</div>
			</div>

			<div className="divide-y divide-gray-700">
				{isLoading && models.length === 0 ? (
					<div className="flex justify-center p-8">
						<Loader className="w-8 h-8 text-gray-400 animate-spin" />
					</div>
				) : models.length > 0 ? (
					<>
						{models.map((model, index) => (
							<ModelCard
								key={`${model.name}-${index}`}
								model={model}
								giftName={giftName}
								onClick={() => onModelSelect(model.name)}
							/>
						))}

						{hasMore && (
							<div ref={loaderRef} className="flex justify-center p-4">
								{isFetching && (
									<Loader className="w-6 h-6 text-gray-400 animate-spin" />
								)}
							</div>
						)}

						{!hasMore && models.length > 0 && (
							<div className="p-4 text-center text-gray-400 text-sm">
								Больше моделей нет
							</div>
						)}
					</>
				) : (
					<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
						<div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
							<Layers className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-300 mb-1">
							Ничего не найдено
						</h3>
						<p className="text-gray-400">
							Попробуйте изменить параметры поиска
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
