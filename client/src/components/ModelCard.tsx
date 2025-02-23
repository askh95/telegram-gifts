// src/components/ModelCard.tsx
import { Model } from "../types/nft";

interface ModelCardProps {
	model: Model;
	giftName: string;
	onClick: () => void;
}

export const ModelCard = ({ model, giftName, onClick }: ModelCardProps) => {
	return (
		<div
			onClick={onClick}
			className="p-6 hover:bg-gray-800/40 transition-all duration-300 cursor-pointer 
                   group border-b border-gray-700/50 hover:border-gray-600/50 first:rounded-t-xl last:rounded-b-xl"
		>
			<div className="flex items-center gap-6">
				<div className="relative group-hover:scale-105 transition-all duration-300">
					<div
						className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                             rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-all duration-300"
					/>
					<div
						className="relative w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-white/10 
                             group-hover:ring-white/20 transition-all"
					>
						<img
							src={`${import.meta.env.VITE_NFT_API}/gifts/${giftName}/models/${
								model.name
							}/image`}
							alt={model.name}
							className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = "none";
							}}
						/>
					</div>
				</div>

				<div className="flex-1">
					<div
						className="font-semibold text-xl text-white/90 group-hover:text-white 
                           transition-colors mb-2"
					>
						{model.name}
					</div>
					<div className="flex flex-wrap gap-4">
						<div
							className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-full
                             group-hover:bg-purple-500/20 transition-all"
						>
							<div className="w-2 h-2 rounded-full bg-purple-400" />
							<span className="text-sm text-purple-200/70">
								{model.ownersCount.toLocaleString()} владельцев
							</span>
						</div>
						<div
							className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full
                             group-hover:bg-blue-500/20 transition-all"
						>
							<div className="w-2 h-2 rounded-full bg-blue-400" />
							<span className="text-sm text-blue-200/70">
								{model.totalGifts.toLocaleString()} подарков
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
