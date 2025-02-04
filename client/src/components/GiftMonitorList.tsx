import { Gift, ExternalLink } from "lucide-react";

interface GiftMonitorListProps {
	updates: any[];
}

export const GiftMonitorList = ({ updates }: GiftMonitorListProps) => {
	const getTelegramLink = (giftName: string, id: number) => {
		return `https://t.me/nft/${giftName}-${id}`;
	};

	if (updates.length === 0) {
		return (
			<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
				<div className="flex items-center gap-2 mb-4">
					<h2 className="text-xl font-bold">Найденные подарки</h2>
					<Gift className="h-5 w-5 text-blue-400" />
				</div>
				<div className="text-gray-400 text-center py-8">
					Пока не найдено ни одного подарка
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
			<div className="flex items-center gap-2 mb-4">
				<h2 className="text-xl font-bold">Найденные подарки</h2>
				<Gift className="h-5 w-5 text-blue-400" />
			</div>

			<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
				<p className="text-yellow-200/90 text-sm">
					Список не отсортирован, ID подарков могут идти в случайном порядке.
					Для проверки текущего прогресса смотрите последний максимальный ID
					сверху мониторинга.
				</p>
			</div>

			<div className="space-y-3">
				{updates.map((update, index) => (
					<div
						key={`${update.currentId}-${index}`}
						className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 
            flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
						style={{
							opacity: 0,
							transform: "translateY(10px)",
							animation: "0.5s ease-out forwards",
							animationName: "fadeIn",
							animationDelay: `${index * 0.1}s`,
						}}
					>
						<style>
							{`
            @keyframes fadeIn {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            `}
						</style>

						<span className="text-gray-400 text-sm">{update.timestamp}</span>
						<a
							href={getTelegramLink(update.giftName, update.currentId)}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 font-medium text-white hover:text-blue-400 transition-colors"
						>
							{update.giftName}
							<ExternalLink className="h-4 w-4" />
						</a>
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 bg-gray-600/50 rounded text-sm text-gray-300">
								ID: {update.currentId}
							</span>
							<span className="text-green-400">✓</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
