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

export const GiftStats = ({ hourlyStats }: GiftStatsProps) => {
	const formattedData = hourlyStats.map((stat) => {
		const hour = parseInt(stat.hour);
		const utc3Hour = (hour + 3) % 24;
		return {
			hour: `${utc3Hour.toString().padStart(2, "0")}:00`,
			purchases: stat.count,
		};
	});

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
			<h3 className="text-xl font-bold text-white mb-4">
				Почасовые покупки (UTC+3)
			</h3>
			<div className="h-[300px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={formattedData}>
						<defs>
							<linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
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
	);
};

export default GiftStats;
