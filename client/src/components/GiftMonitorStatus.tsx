import { Activity } from "lucide-react";

interface GiftMonitorStatusProps {
	status: "connecting" | "connected" | "disconnected" | "error";
	lastMaxId: number;
	currentGiftName: string | null;
}

export const GiftMonitorStatus = ({
	status,
	lastMaxId,
	currentGiftName,
}: GiftMonitorStatusProps) => {
	const getStatusColor = () => {
		switch (status) {
			case "connected":
				return "text-green-400";
			case "connecting":
				return "text-yellow-400";
			case "disconnected":
			case "error":
				return "text-red-400";
			default:
				return "text-gray-400";
		}
	};

	const getStatusText = () => {
		switch (status) {
			case "connected":
				return "Подключено";
			case "connecting":
				return "Подключение...";
			case "disconnected":
				return "Отключено";
			case "error":
				return "Ошибка соединения";
			default:
				return "Неизвестно";
		}
	};

	const getTelegramLink = (giftName: string, id: number) => {
		return `https://t.me/nft/${giftName}-${id}`;
	};

	return (
		<div
			className="flex flex-col sm:flex-row justify-between items-start sm:items-center 
            mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
		>
			<div className="flex items-center gap-2">
				<Activity className={`h-5 w-5 ${getStatusColor()}`} />
				<span className={getStatusColor()}>{getStatusText()}</span>
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-600/50">
					<span className="text-gray-400">Текущий ID:</span>
					<span className="text-green-400 font-bold text-lg animate-pulse px-3 py-1 bg-green-500/10 rounded">
						{lastMaxId}
					</span>
				</div>
				{lastMaxId > 0 && currentGiftName && (
					<a
						href={getTelegramLink(currentGiftName, lastMaxId)}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-400 hover:text-blue-300 text-base font-bold  text-start transition-colors duration-200"
					>
						Посмотреть на подарок
					</a>
				)}
			</div>
		</div>
	);
};
