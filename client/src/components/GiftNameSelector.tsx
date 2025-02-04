import {
	useGetGiftNamesQuery,
	useStartMonitoringMutation,
} from "../store/api/monitor";

export const GiftNameSelector = () => {
	const { data: giftNames, isLoading } = useGetGiftNamesQuery();
	const [startMonitoring] = useStartMonitoringMutation();

	const formatGiftName = (name: string) => {
		return name.replace(/[^a-zA-Z]/g, "");
	};

	const handleGiftSelect = async (giftName: string) => {
		try {
			const formattedName = formatGiftName(giftName);
			await startMonitoring({ gift_name: formattedName });
		} catch (error) {
			console.error("Error starting monitoring:", error);
		}
	};

	if (isLoading) {
		return <div className="text-gray-400">Загрузка списка подарков...</div>;
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{Object.entries(giftNames || {}).map(([id, name]) => (
				<button
					key={id}
					onClick={() => handleGiftSelect(name)}
					className="p-4 bg-gray-700/40 rounded-lg hover:bg-gray-600/40 
                   transition-colors text-left text-green-400 font-mono"
				>
					{name}
				</button>
			))}
		</div>
	);
};
