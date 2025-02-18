// src/components/NFTGiftCard.tsx
import { NFTGift } from "../types/nft";
import { Clock, Layers } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { useUserTimezone } from "../hooks/useUserTimezone";

interface NFTGiftCardProps {
	gift: NFTGift;
	onClick: (id: string) => void;
}

export const NFTGiftCard = ({ gift, onClick }: NFTGiftCardProps) => {
	const { offset } = useUserTimezone();
	const percentComplete = (gift.issued / gift.total) * 100;

	const formatLastUpdated = (timestamp: string) => {
		const date = dayjs.utc(timestamp);
		const localDate = date.local();
		const sign = offset >= 0 ? "+" : "";
		return `${localDate.format("DD.MM.YYYY HH:mm")} (UTC ${sign}${offset})`;
	};

	return (
		<div
			onClick={() => onClick(gift._id)}
			className="relative bg-gradient-to-b from-gray-800/80 to-gray-900/90 backdrop-blur-sm 
        rounded-xl p-3 md:p-4 shadow-lg 
        border border-gray-700/50 
        hover:border-purple-500/50 hover:scale-[1.01] 
        hover:shadow-xl hover:shadow-purple-500/10 
        transition-all duration-300 ease-out cursor-pointer overflow-hidden
        before:absolute before:inset-0 
        before:bg-gradient-to-r before:from-purple-500/10 before:via-blue-500/10 before:to-purple-500/10
        before:rounded-xl before:opacity-0 before:hover:opacity-100 before:transition-opacity
        after:absolute after:inset-0 
        after:bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),transparent_80%)]"
		>
			<div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 md:gap-4">
				<div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
					<div
						className="w-full h-full flex items-center justify-center rounded-lg 
              bg-gradient-to-b from-gray-700/50 to-gray-800/50 
              shadow-inner shadow-purple-500/5"
					>
						<span className="text-5xl sm:text-6xl">🎁</span>
					</div>
					<div
						className="absolute -top-2 -right-2 px-2.5 py-1 rounded-lg text-xs font-medium 
              bg-gradient-to-r from-purple-500 to-blue-500 text-white
              shadow-lg shadow-purple-500/20"
					>
						NFT
					</div>
				</div>

				<div className="flex-grow min-w-0 w-full sm:w-auto">
					<div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-3">
						<h3 className="text-xl font-bold text-white order-2 sm:order-1">
							{gift.name}
						</h3>
						<div
							className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg 
                bg-gradient-to-r from-gray-700/50 to-gray-800/50 
                order-1 sm:order-2 shadow-inner shadow-purple-500/5"
						>
							<Layers className="h-4 w-4 text-blue-400" />
							<span className="text-sm font-medium text-gray-200">
								{gift.modelsCount} моделей
							</span>
						</div>
					</div>

					<div>
						<div className="relative w-full pt-6">
							<span
								className="absolute bottom-0 mb-9 -translate-x-1/2
                    px-3.5 py-2 text-white text-sm font-medium 
                    flex justify-center items-center gap-1.5
                    bg-gradient-to-r from-blue-500 to-blue-600
                    rounded-full shadow-lg shadow-blue-500/20
                    after:absolute after:bg-gradient-to-r after:from-blue-500 after:to-blue-600 
                    after:flex after:bottom-[-5px] 
                    after:left-1/2 after:-z-10 after:h-3 after:w-3 
                    after:-translate-x-1/2 after:rotate-45"
								style={{ left: `${percentComplete}%` }}
							>
								{gift.issued.toLocaleString()}
							</span>
							<div
								className="relative flex w-full h-6 overflow-hidden rounded-2xl 
                  bg-gradient-to-r from-gray-700/50 to-gray-800/50 my-4
                  shadow-inner shadow-purple-500/5"
							>
								<div
									role="progressbar"
									aria-valuenow={percentComplete}
									aria-valuemin={0}
									aria-valuemax={100}
									style={{ width: `${percentComplete}%` }}
									className="flex h-full items-center justify-center 
                    bg-gradient-to-r from-blue-500 to-blue-600 
                    rounded-2xl transition-all duration-300
                    shadow-lg shadow-blue-500/20"
								/>
								<div
									className="absolute right-0 top-1/2 -translate-y-1/2 
                    px-4 text-base font-medium text-gray-300
                    text-shadow-sm shadow-purple-500/50"
								>
									{gift.total.toLocaleString()}
								</div>
							</div>
						</div>

						<div
							className="flex items-center justify-center sm:justify-start gap-2 
                mt-3 px-2.5 py-1 rounded-lg 
                 "
						>
							<Clock className="h-4 w-4 text-gray-400" />
							<span className="text-sm ">
								Обновлено {formatLastUpdated(gift.lastUpdated)}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NFTGiftCard;
