import { FC, useRef, useState, useEffect } from "react";
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
} from "../store/api/gifts";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { GiftHistory } from "../components/GiftHistory";
import { GiftStats } from "../components/GiftStats";

interface AnimatedValueProps {
	value: number;
	formatter?: (value: number) => string;
}

const AnimatedValue: FC<AnimatedValueProps> = ({
	value,
	formatter = (val) => val.toLocaleString(),
}) => {
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

const formatUTC3Date = (date: string | number | Date) => {
	const utc3Date = new Date(date);
	utc3Date.setHours(utc3Date.getHours() + 3);

	return (
		new Intl.DateTimeFormat("ru-RU", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "UTC",
		}).format(utc3Date) + " (UTC+3)"
	);
};

export const GiftDetails: FC = () => {
	const { id = "" } = useParams();
	const navigate = useNavigate();

	const { data: gift, refetch: refetchGift } = useGetGiftByIdQuery(id);
	const { data: stats, refetch: refetchStats } = useGetGiftStatsQuery(id);
	const { data: history, refetch: refetchHistory } = useGetGiftHistoryQuery({
		id,
		limit: 15,
	});
	// const { data: sticker } = useGetGiftStickerQuery(gift?.telegram_id ?? "");

	useAutoRefresh(() => {
		refetchStats();
		refetchHistory();
		refetchGift();
	});

	if (!gift || !stats || !history) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	const purchased = stats.total_count - stats.current_count;

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate("/")}
							className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 
                      backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-gray-600/50 
                      transition-all text-gray-300 hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Назад к списку
						</button>
						<h1 className="text-2xl font-bold">Детали подарка</h1>
					</div>
					<div className="text-gray-400 text-sm flex items-center gap-2">
						<RefreshCcw className="h-4 w-4" />
						Последнее обновление: {formatUTC3Date(gift.last_updated)}
					</div>
				</div>

				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<div className="flex flex-col sm:flex-row items-center gap-6">
						<div className="relative w-32 h-32 flex-shrink-0">
							{/* {sticker ? (
								<TGSticker
									fileUrl={sticker.file_url}
									size={128}
									className="w-full h-full object-cover rounded-lg"
								/>
							) : ( */}
							<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg">
								<span className="text-4xl">{gift.emoji}</span>
							</div>
							{/* )} */}
							<div className="absolute top-2 right-2 bg-blue-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
								{gift.star_count} ⭐
							</div>
						</div>

						<div className="flex-grow text-center sm:text-left">
							<h2 className="text-xl font-bold text-white mb-2">
								Telegram Подарок {gift.emoji}
							</h2>
							<div className="space-y-2">
								<p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
									<span className="w-2 h-2 rounded-full bg-emerald-400"></span>
									ID: {gift.telegram_id}
								</p>
								<p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
									<span className="w-2 h-2 rounded-full bg-emerald-400"></span>
									Размер: {gift.file_size} байт
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
							{((parseInt(stats.analytics.peak_hour.hour) + 3) % 24)
								.toString()
								.padStart(2, "0")}
							:00
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
						<p className="text-xs text-gray-400">
							Ожидаемое завершение:{" "}
							{formatUTC3Date(stats.analytics.prediction.predicted_sold_out)}
						</p>
					</div>
				</div>

				<GiftStats hourlyStats={stats.analytics.hourly_stats} />

				<GiftHistory history={history} />
			</div>
		</div>
	);
};
