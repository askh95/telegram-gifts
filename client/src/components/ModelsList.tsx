import { Model } from "../types/nft";
import { Layers, ChevronRight, Search } from "lucide-react";

interface ModelsListProps {
	models: Model[];
	onModelSelect: (modelName: string) => void;
	onSearch: (query: string) => void;
	isLoading?: boolean;
}

export const ModelsList = ({
	models,
	onModelSelect,
	onSearch,
	isLoading = false,
}: ModelsListProps) => {
	return (
		<div>
			<div className="p-4 border-b border-gray-700">
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						onChange={(e) => onSearch(e.target.value)}
						placeholder="Поиск модели..."
						className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-purple-500/50 focus:border-purple-500"
					/>
				</div>
			</div>

			<div className="divide-y divide-gray-700">
				{isLoading ? (
					<div className="flex justify-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
					</div>
				) : models.length > 0 ? (
					models.map((model) => (
						<div
							key={model.name}
							onClick={() => onModelSelect(model.name)}
							className="flex items-center justify-between p-4 hover:bg-gray-700/50 
                       transition-colors cursor-pointer group"
						>
							<div className="flex items-center gap-4">
								<div
									className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 
                             to-blue-500 flex items-center justify-center 
                             group-hover:from-purple-400 group-hover:to-blue-400 
                             transition-all"
								>
									<Layers className="w-6 h-6 text-white" />
								</div>
								<div>
									<div className="font-medium">{model.name}</div>
									<div className="text-sm text-gray-400">
										{model.ownersCount.toLocaleString()} владельцев •{" "}
										{model.totalGifts.toLocaleString()} подарков
									</div>
								</div>
							</div>
							<ChevronRight
								className="w-5 h-5 text-gray-400 group-hover:text-white 
                          transition-colors"
							/>
						</div>
					))
				) : (
					<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
						<div
							className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center 
                          justify-center mb-4"
						>
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
