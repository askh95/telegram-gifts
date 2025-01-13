import {
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	CartesianGrid,
} from "recharts";

interface HourlyStat {
	hour: string;
	count: number;
}

interface GiftStatsProps {
	hourlyStats: HourlyStat[];
}

interface TooltipProps {
	active?: boolean;
	payload?: Array<{
		name: string;
		value: number;
	}>;
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
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

export const GiftStats = ({ hourlyStats }: GiftStatsProps) => {
	const formattedData = hourlyStats.map((stat) => {
		const hour = parseInt(stat.hour);

		return {
			hour: `${hour.toString().padStart(2, "0")}:00`,
			purchases: stat.count,
		};
	});

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700/50">
			<h3 className="text-lg sm:text-xs font-bold text-white mb-2 sm:mb-4">
				Почасовые покупки <u>UTC +0</u>
			</h3>
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
							dataKey="hour"
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
	);
};

export default GiftStats;
