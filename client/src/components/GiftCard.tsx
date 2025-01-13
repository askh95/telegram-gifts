// src/components/GiftCard.tsx
import { Gift } from "../types/gift";
import { useGetGiftStickerQuery } from "../store/api/gifts";
import { Star, Clock } from "lucide-react";

interface GiftCardProps {
	gift: Gift;
	onClick: (id: string) => void;
}

export const GiftCard = ({ gift, onClick }: GiftCardProps) => {
	const { data: sticker } = useGetGiftStickerQuery(gift.custom_emoji_id);

	const percentComplete =
		((gift.total_count - gift.remaining_count) / gift.total_count) * 100;

	return (
		<div
			onClick={() => onClick(gift.telegram_id)}
			className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50 
                 hover:border-gray-600/50 transition-all cursor-pointer"
		>
			<div className="flex items-start gap-6">
				<div className="relative w-32 h-32 flex-shrink-0">
					{sticker ? (
						<img
							src={sticker.file_url}
							alt="Gift sticker"
							className="w-full h-full object-cover rounded-lg"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg">
							<span className="text-4xl">{gift.emoji}</span>
						</div>
					)}
					<div className="absolute top-2 right-2 bg-blue-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
						{gift.is_animated ? "Animated" : "Static"}
					</div>
				</div>

				<div className="flex-grow">
					<div className="flex items-center gap-2 mb-2">
						<Star className="h-4 w-4 text-yellow-400" />
						<span className="text-xl font-bold text-white">
							{gift.star_count.toLocaleString()}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<div className="text-sm text-gray-400">Remaining</div>
							<div className="text-lg font-semibold text-white">
								{gift.remaining_count.toLocaleString()}
							</div>
						</div>
						<div>
							<div className="text-sm text-gray-400">Total</div>
							<div className="text-lg font-semibold text-white">
								{gift.total_count.toLocaleString()}
							</div>
						</div>
					</div>

					<div className="w-full bg-gray-700 rounded-full h-2 mb-4">
						<div
							className="bg-blue-500 rounded-full h-2 transition-all duration-300"
							style={{ width: `${percentComplete}%` }}
						/>
					</div>

					<div className="flex items-center gap-2 text-sm text-gray-400">
						<Clock className="h-4 w-4" />
						<span>Updated {new Date(gift.last_updated).toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
