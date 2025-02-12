import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Calculator,
	TrendingDown,
	Clock,
	Activity,
	RefreshCcw,
	ArrowLeft,
} from "lucide-react";
import {
	useGetGiftByIdQuery,
	useGetGiftStatsQuery,
	useGetGiftHistoryQuery,
	useGetGiftThumbnailQuery,
} from "../store/api/gifts";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useUserTimezone } from "../hooks/useUserTimezone";
import { GiftHistory } from "../components/GiftHistory";
import { GiftStats } from "../components/GiftStats";
import { useGetGiftNamesQuery } from "../store/api/monitor";

interface AnimatedValueProps {
	value: number;
	formatter?: (value: number) => string;
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const AnimatedValue = ({
	value,
	formatter = (val) => val.toLocaleString(),
}: AnimatedValueProps) => {
	const [textColor, setTextColor] = useState("text-white");
	const prevValueRef = useRef(value);

	useEffect(() => {
		if (value !== prevValueRef.current) {
			setTextColor(
				value > prevValueRef.current ? "text-green-400" : "text-red-400"
			);
			prevValueRef.current = value;

			const timer = setTimeout(() => {
				setTextColor("text-white");
			}, 900);

			return () => clearTimeout(timer);
		}
	}, [value]);

	return (
		<div
			className={`text-2xl font-bold transition-colors duration-200 ${textColor}`}
		>
			{formatter(value)}
		</div>
	);
};

export const GiftDetails = () => {
	const { offset } = useUserTimezone();
	const { id = "" } = useParams();
	const navigate = useNavigate();

	const { data: initialStats } = useGetGiftStatsQuery({
		id,
		period: undefined,
	});

	const defaultPeriod = initialStats?.current_count === 0 ? "all" : "24h";
	const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "all">(
		defaultPeriod
	);

	const { data: gift, refetch: refetchGift } = useGetGiftByIdQuery(id);
	const { data: stats, refetch: refetchStats } = useGetGiftStatsQuery({
		id,
		period: period === "24h" ? undefined : period,
	});
	const { data: thumbnailUrl } = useGetGiftThumbnailQuery(id);
	const { data: history, refetch: refetchHistory } = useGetGiftHistoryQuery({
		id,
		limit: 15,
	});
	const { data: giftNames } = useGetGiftNamesQuery();

	const formatDateTime = (isoString: string) => {
		try {
			const cleanDateTime = isoString.split(".")[0];
			const date = dayjs(cleanDateTime);

			if (!date.isValid()) {
				console.error("Invalid date:", isoString);
				return "Неверная дата";
			}

			const localDate = date.add(offset, "hour");
			const sign = offset >= 0 ? "+" : "";
			return `${localDate.format(
				"DD.MM.YYYY HH:mm ss"
			)} сек. (UTC ${sign}${offset})`;
		} catch (error) {
			console.error("Date parsing error:", error, "for date:", isoString);
			return "Ошибка формата даты";
		}
	};

	const formatPeakHour = (hour: string) => {
		try {
			const hourNum = parseInt(hour);
			const localHour = (hourNum + offset) % 24;
			const adjustedHour = localHour < 0 ? localHour + 24 : localHour;
			return `${adjustedHour.toString().padStart(2, "0")}:00`;
		} catch (error) {
			console.error("Hour parsing error:", error);
			return "00:00";
		}
	};

	useAutoRefresh(() => {
		if (stats?.status !== "sold_out") {
			refetchStats();
			refetchHistory();
			refetchGift();
		}
	});

	if (!gift || !stats || !history) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	const handlePeriodChange = async (
		newPeriod: "24h" | "7d" | "30d" | "all"
	) => {
		setPeriod(newPeriod);
		await refetchStats();
	};

	const purchased = stats.total_count - stats.current_count;

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate(-1)}
							className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 
                backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-gray-600/50 
                transition-all text-gray-300 hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Назад
						</button>
					</div>
					<div className="text-gray-400 text-sm flex items-center gap-2">
						<RefreshCcw className="h-4 w-4" />
						Обновлено: {formatDateTime(gift.last_updated)}
					</div>
				</div>

				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<div className="flex flex-col sm:flex-row items-center gap-6">
						<div className="relative w-32 h-32 flex-shrink-0">
							<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg">
								<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg overflow-hidden">
									<img
										src={thumbnailUrl}
										alt={gift.emoji}
										className="w-full h-full object-contain transform transition-transform duration-200 hover:scale-110"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.onerror = null;
											target.className = "hidden";
											target.parentElement?.insertAdjacentHTML(
												"beforeend",
												`<span class="text-7xl">${gift.emoji}</span>`
											);
										}}
									/>
								</div>
							</div>
							<div className="absolute top-2 right-2 bg-blue-500/80 backdrop-blur-sm text-white text-sm font-bold px-3 py-1 rounded-full">
								{gift.star_count} ⭐
							</div>
						</div>

						<div className="flex-grow text-center sm:text-left">
							<h2 className="text-xl font-bold text-white mb-2">
								{giftNames?.[gift.telegram_id] ||
									`Telegram Подарок ${gift.emoji}`}
							</h2>
							<div className="space-y-2">
								<p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
									<span className="w-2 h-2 rounded-full bg-emerald-400"></span>
									ID: {gift.telegram_id}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">Куплено</h3>
							<Activity className="h-4 w-4 text-purple-400" />
						</div>
						<AnimatedValue value={purchased} />
						<p className="text-xs text-gray-400">
							{((purchased / stats.total_count) * 100).toFixed(1)}% от общего
						</p>
					</div>

					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">
								Скорость покупок
							</h3>
							<TrendingDown className="h-4 w-4 text-red-400" />
						</div>
						<AnimatedValue value={Math.round(stats.analytics.purchase_rate)} />
						<p className="text-xs text-gray-400">В час</p>
					</div>

					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">Пиковый час</h3>
							<Clock className="h-4 w-4 text-green-400" />
						</div>
						<div className="text-2xl font-bold text-white">
							{formatPeakHour(stats.analytics.peak_hour.hour)}
						</div>
						<p className="text-xs text-gray-400">
							{stats.analytics.peak_hour.count.toLocaleString()} покупок
						</p>
					</div>

					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">Осталось</h3>
							<Calculator className="h-4 w-4 text-blue-400" />
						</div>
						<AnimatedValue value={stats.current_count} />
						{stats.status !== "sold_out" && (
							<p className="text-xs text-gray-400">
								Ожидаемое завершение:{" "}
								{formatDateTime(stats.analytics.prediction.predicted_sold_out)}
							</p>
						)}
					</div>
				</div>

				<GiftStats
					hourlyStats={stats.analytics.hourly_stats}
					period={period}
					onPeriodChange={handlePeriodChange}
				/>

				<GiftHistory history={history} formatDateTime={formatDateTime} />
			</div>
		</div>
	);
};
