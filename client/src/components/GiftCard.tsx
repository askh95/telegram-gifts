import { Gift } from "../types/gift";
import { Star, Clock, GiftIcon } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { useGetGiftThumbnailQuery } from "../store/api/gifts";
import { useGetGiftNamesQuery } from "../store/api/monitor";

interface GiftCardProps {
	gift: Gift;
	onClick: (id: string) => void;
}

export const GiftCard = ({ gift, onClick }: GiftCardProps) => {
	const { offset } = useUserTimezone();
	const { data: thumbnailUrl } = useGetGiftThumbnailQuery(gift.telegram_id);
	const { data: giftNames } = useGetGiftNamesQuery();
	const percentComplete = (gift.remaining_count / gift.total_count) * 100;

	const isSoldOut = gift.status === "sold_out";
	const giftName = giftNames?.[gift.telegram_id];

	const formatLastUpdated = (timestamp: string) => {
		const date = dayjs.utc(timestamp);
		const localDate = date.local();
		const sign = offset >= 0 ? "+" : "";
		return `${localDate.format("DD.MM.YYYY HH:mm")} (UTC ${sign}${offset})`;
	};

	return (
		<div
			onClick={() => onClick(gift.telegram_id)}
			className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-gray-700/50 
          hover:border-gray-600/50 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 
          transition-all duration-300 ease-out cursor-pointer overflow-x-hidden
          ${isSoldOut ? "opacity-75" : ""}`}
		>
			<div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
				<div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
					<div className="w-full h-full flex items-center justify-center rounded-lg">
						{thumbnailUrl ? (
							<img
								src={thumbnailUrl}
								alt={gift.emoji}
								className="w-full h-full object-contain"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.onerror = null;
									target.className = "hidden";
									target.parentElement?.insertAdjacentHTML(
										"beforeend",
										`<span class="text-5xl sm:text-6xl">${gift.emoji}</span>`
									);
								}}
							/>
						) : (
							<span className="text-5xl sm:text-6xl">{gift.emoji}</span>
						)}
					</div>

					<div
						className={`absolute -top-2 -right-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium
                ${
									isSoldOut
										? "bg-red-500/40 text-white"
										: "bg-[#8469C0] text-white"
								}`}
					>
						{isSoldOut ? "Раскупили" : "Редкий"}
					</div>
				</div>

				<div className="flex-grow min-w-0 w-full sm:w-auto">
					<div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
						<Star className="h-4 w-4 text-yellow-400" />
						<span className="text-lg sm:text-xl font-bold text-white">
							{gift.star_count.toLocaleString()}
						</span>
					</div>

					{giftName && (
						<div className="text-center sm:text-left text-base font-medium text-gray-400 mb-2">
							{giftName}
						</div>
					)}

					<div>
						{gift.remaining_count > 0 ? (
							<div className="relative w-full pt-6">
								<span
									className="absolute bottom-0 mb-9 -translate-x-1/2 bg-blue-500 
                        shadow-[0px_12px_30px_0px_rgba(16,24,40,0.1)] rounded-full 
                        px-3.5 py-2 text-white text-sm font-medium 
                        flex justify-center items-center gap-1.5
                        after:absolute after:bg-blue-500 after:flex after:bottom-[-5px] 
                        after:left-1/2 after:-z-10 after:h-3 after:w-3 
                        after:-translate-x-1/2 after:rotate-45"
									style={{ left: `${percentComplete}%` }}
								>
									<GiftIcon className="h-4 w-4" />
									{gift.remaining_count.toLocaleString()}
								</span>
								<div className="relative flex w-full h-6 overflow-hidden rounded-3xl bg-gray-700 my-4">
									<div
										role="progressbar"
										aria-valuenow={percentComplete}
										aria-valuemin={0}
										aria-valuemax={100}
										style={{ width: `${percentComplete}%` }}
										className="flex h-full items-center justify-center bg-blue-500 text-white rounded-3xl transition-all duration-300"
									/>
									<div className="absolute right-0 top-1/2 -translate-y-1/2 px-4 text-base font-bold text-gray-400">
										{gift.total_count.toLocaleString()}
									</div>
								</div>
							</div>
						) : (
							<div className="flex justify-center sm:justify-start mb-4">
								<span className="bg-red-500/80 rounded-full px-3.5 py-2 text-white text-sm font-medium">
									Подарок уже распродан
								</span>
							</div>
						)}

						<div className="flex items-center justify-center sm:justify-start gap-2 text-start sm:text-sm text-gray-400 mt-3">
							<Clock className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="text-center sm:text-left">
								Обновлено {formatLastUpdated(gift.last_updated)}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GiftCard;
