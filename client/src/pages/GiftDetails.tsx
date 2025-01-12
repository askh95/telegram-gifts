import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	CartesianGrid,
} from "recharts";
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
	useGetGiftStickerQuery,
} from "../store/api/gifts";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { TGSticker } from "../components/TGSticker";

// Utility function for UTC+3 date formatting
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

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg">
				<p className="text-gray-300 text-sm mb-1">{label}</p>
				<p className="text-white font-medium">
					{payload[0].name}: {payload[0].value.toLocaleString()}
				</p>
			</div>
		);
	}
	return null;
};

export const GiftDetails: FC = () => {
	const { id = "" } = useParams();
	const navigate = useNavigate();

	const { data: gift, refetch: refetchGift } = useGetGiftByIdQuery(id);
	const { data: stats, refetch: refetchStats } = useGetGiftStatsQuery(id);
	const { data: history, refetch: refetchHistory } = useGetGiftHistoryQuery(id);
	const { data: sticker } = useGetGiftStickerQuery(gift?.telegram_id ?? "");

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

	// Process hourly data with UTC+3 time
	const hourlyData = stats.analytics.hourly_stats.map((stat) => {
		const hour = parseInt(stat.hour);
		const utc3Hour = (hour + 3) % 24;
		return {
			hour: `${utc3Hour.toString().padStart(2, "0")}:00`,
			purchases: stat.count,
		};
	});

	// Process time series data with UTC+3 time
	const timeSeriesData = history.map((item) => ({
		date: formatUTC3Date(item.last_updated),
		amount: item.remaining_count,
	}));

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header with last update */}
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

				{/* Gift card */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<div className="flex flex-col sm:flex-row items-center gap-6">
						<div className="relative w-32 h-32 flex-shrink-0">
							{sticker ? (
								<TGSticker
									fileUrl={sticker.file_url}
									size={128}
									className="w-full h-full object-cover rounded-lg"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gray-700/50 rounded-lg">
									<span className="text-4xl">{gift.emoji}</span>
								</div>
							)}
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

				{/* Stats grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Total purchased */}
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">Куплено</h3>
							<Activity className="h-4 w-4 text-purple-400" />
						</div>
						<div className="text-2xl font-bold text-white">
							{(stats.total_count - stats.current_count).toLocaleString()}
						</div>
						<p className="text-xs text-gray-400">
							{(
								((stats.total_count - stats.current_count) /
									stats.total_count) *
								100
							).toFixed(1)}
							% от общего
						</p>
					</div>

					{/* Purchase rate */}
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">
								Скорость покупок
							</h3>
							<TrendingDown className="h-4 w-4 text-red-400" />
						</div>
						<div className="text-2xl font-bold text-white">
							{Math.round(stats.analytics.purchase_rate).toLocaleString()}
						</div>
						<p className="text-xs text-gray-400">В час</p>
					</div>

					{/* Peak hour */}
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

					{/* Remaining */}
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-gray-200">Осталось</h3>
							<Calculator className="h-4 w-4 text-blue-400" />
						</div>
						<div className="text-2xl font-bold text-white">
							{stats.current_count.toLocaleString()}
						</div>
						<p className="text-xs text-gray-400">
							Ожидаемое завершение:{" "}
							{formatUTC3Date(stats.analytics.prediction.predicted_sold_out)}
						</p>
					</div>
				</div>

				{/* Balance History Chart */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<h3 className="text-xl font-bold text-white mb-4">История баланса</h3>
					<div className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={timeSeriesData}>
								<defs>
									<linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis
									dataKey="date"
									stroke="#888888"
									fontSize={12}
									angle={-45}
									textAnchor="end"
									height={70}
								/>
								<YAxis stroke="#888888" fontSize={12} />
								<Tooltip content={<CustomTooltip />} />
								<Area
									type="monotone"
									dataKey="amount"
									name="Количество"
									stroke="#818cf8"
									fill="url(#colorAmount)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Hourly Stats Chart */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<h3 className="text-xl font-bold text-white mb-4">
						Почасовые покупки (UTC+3)
					</h3>
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={hourlyData}>
								<defs>
									<linearGradient
										id="colorPurchases"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis dataKey="hour" stroke="#888888" fontSize={12} />
								<YAxis stroke="#888888" fontSize={12} />
								<Tooltip content={<CustomTooltip />} />
								<Area
									type="monotone"
									dataKey="purchases"
									name="Покупки"
									stroke="#34d399"
									fill="url(#colorPurchases)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
};
