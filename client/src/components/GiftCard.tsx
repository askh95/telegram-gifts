import { Gift } from "../types/gift";
import { Star, Clock } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { useUserTimezone } from "../hooks/useUserTimezone";

interface GiftCardProps {
	gift: Gift;
	onClick: (id: string) => void;
}

export const GiftCard = ({ gift, onClick }: GiftCardProps) => {
	const { offset } = useUserTimezone();

	const percentComplete =
		((gift.total_count - gift.remaining_count) / gift.total_count) * 100;
	const isSoldOut = gift.status === "sold_out";

	const formatLastUpdated = (timestamp: string) => {
		const date = dayjs(timestamp);
		const localDate = date.add(offset, "hour");
		const sign = offset >= 0 ? "+" : "";
		return `${localDate.format("DD.MM.YYYY HH:mm")} (UTC ${sign}${offset})`;
	};

	return (
		<div
			onClick={() => onClick(gift.telegram_id)}
			className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-gray-700/50 
            hover:border-gray-600/50 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 
            transition-all duration-300 ease-out cursor-pointer
            ${isSoldOut ? "opacity-75" : ""}`}
		>
			<div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
				<div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
					<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg">
						<span className="text-5xl sm:text-6xl">{gift.emoji}</span>
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

					<div className="flex justify-between mb-3 px-4 sm:px-0">
						<div className="text-center sm:text-left">
							<div className="text-xs sm:text-sm text-gray-400">Осталось</div>
							<div className="text-base sm:text-lg font-semibold text-white">
								{gift.remaining_count.toLocaleString()}
							</div>
						</div>
						<div className="text-center sm:text-left">
							<div className="text-xs sm:text-sm text-gray-400">Всего</div>
							<div className="text-base sm:text-lg font-semibold text-white">
								{gift.total_count.toLocaleString()}
							</div>
						</div>
					</div>

					<div>
						<div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 mb-3">
							<div
								className="bg-blue-500 rounded-full h-1.5 sm:h-2 transition-all duration-300"
								style={{ width: `${percentComplete}%` }}
							/>
						</div>

						<div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-400">
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
