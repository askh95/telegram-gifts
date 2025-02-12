import dayjs from "dayjs";
import {
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	CartesianGrid,
	TooltipProps,
} from "recharts";
import { useUserTimezone } from "../hooks/useUserTimezone";

interface HourlyStat {
	date?: string;
	hour: string;
	count: number;
}

interface GiftStatsProps {
	hourlyStats: HourlyStat[];
	period: "24h" | "7d" | "30d" | "all";
	onPeriodChange: (period: "24h" | "7d" | "30d" | "all") => void;
}

interface DataPoint {
	date?: string;
	hour: string;
	purchases: number;
	displayDate?: string;
}

interface CustomTooltipData {
	name: string;
	value: number;
	payload: DataPoint;
}

const CustomTooltip = ({
	active,
	payload,
	label,
	currentDataSet,
}: TooltipProps<number, string> & {
	currentDataSet?: DataPoint[];
}) => {
	if (!active || !currentDataSet?.length) return null;

	const data = payload?.[0] as CustomTooltipData | undefined;
	if (!data?.name || !data?.value) return null;

	const lastPoint = currentDataSet[currentDataSet.length - 1];
	const isLastPoint = label === lastPoint.hour;
	const formattedDate = data.payload.date
		? dayjs(data.payload.date).format("DD.MM.YYYY")
		: "";

	return (
		<div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg">
			<p className="text-gray-300 text-sm mb-1">
				{formattedDate}
				{formattedDate && ", "}
				{data.payload.hour}
				{isLastPoint && (
					<span className="text-gray-400 ml-2">- {getCurrentTime()}</span>
				)}
			</p>
			<p className="text-white font-medium">
				{data.name}: {data.value.toLocaleString()}
			</p>
		</div>
	);
};

const getCurrentTime = () => {
	const now = new Date();
	return `${String(now.getHours()).padStart(2, "0")}:${String(
		now.getMinutes()
	).padStart(2, "0")}`;
};

const periodLabels = {
	"24h": "24 часа",
	"7d": "7 дней",
	"30d": "30 дней",
	all: "Всё время",
} as const;

export const GiftStats = ({
	hourlyStats,
	period,
	onPeriodChange,
}: GiftStatsProps) => {
	const { offset } = useUserTimezone();

	const formattedData = hourlyStats.map((stat) => {
		const hour = (parseInt(stat.hour) + offset + 24) % 24;
		const formattedHour = `${hour.toString().padStart(2, "0")}:00`;

		// Если период не 24h и есть дата, форматируем её
		if (period !== "24h" && stat.date) {
			const date = dayjs(stat.date);
			return {
				date: stat.date,
				displayDate: date.format("DD.MM.YYYY"),
				hour: formattedHour,
				purchases: stat.count,
			};
		}

		// Для периода 24h оставляем только час
		return {
			hour: formattedHour,
			purchases: stat.count,
		};
	});

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700/50">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-base sm:text-lg font-bold text-white">
					Почасовые покупки
				</h3>
				<select
					value={period}
					onChange={(e) => onPeriodChange(e.target.value as typeof period)}
					className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
				>
					{(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map(
						(key) => (
							<option key={key} value={key}>
								{periodLabels[key]}
							</option>
						)
					)}
				</select>
			</div>

			<div className="h-[200px] sm:h-[250px] md:h-[300px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={formattedData}
						margin={{
							top: 5,
							right: 10,
							left: -10,
							bottom: 5,
						}}
					>
						<defs>
							<linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
								<stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#374151"
							vertical={false}
						/>
						<XAxis
							dataKey={period === "24h" ? "hour" : "displayDate"}
							stroke="#888888"
							fontSize={10}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							stroke="#888888"
							fontSize={10}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip<number, string>
							content={(props) => (
								<CustomTooltip {...props} currentDataSet={formattedData} />
							)}
						/>
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
	);
};

export default GiftStats;
