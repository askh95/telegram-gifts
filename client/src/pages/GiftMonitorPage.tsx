import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { GiftMonitorInput } from "../components/GiftMonitorInput";
import { GiftMonitorStatus } from "../components/GiftMonitorStatus";
import { GiftMonitorList } from "../components/GiftMonitorList";
import { useStartMonitoringMutation } from "../store/api/monitor";

export type GiftUpdate = {
	giftName: string;
	currentId: number;
	timestamp: string;
	found: boolean;
};

export const GiftMonitorPage = () => {
	const [updates, setUpdates] = useState<GiftUpdate[]>([]);
	const [currentGiftName, setCurrentGiftName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [startMonitoring] = useStartMonitoringMutation();

	const lastMaxId = updates.reduce(
		(max, update) => Math.max(max, update.currentId),
		0
	);

	const handleWebSocketMessage = useCallback(
		(data: string) => {
			const parsedData = JSON.parse(data);

			if (parsedData.found && parsedData.gift_name === currentGiftName) {
				setUpdates((prev) => [
					{
						giftName: parsedData.gift_name,
						currentId: parsedData.current_id,
						timestamp: new Date().toLocaleTimeString(),
						found: true,
					},
					...prev.slice(0, 49),
				]);
			}
		},
		[currentGiftName]
	);

	useEffect(() => {
		setUpdates([]);
	}, [currentGiftName]);

	const { status } = useWebSocket({
		url: "ws://localhost:3001/ws",
		onMessage: handleWebSocketMessage,
		currentGiftName,
	});

	const handleStartMonitoring = async (giftName: string) => {
		try {
			setError(null);

			const response = await startMonitoring({ gift_name: giftName }).unwrap();

			if (response.status === "not_found") {
				setError(`Подарок "${giftName}" не найден`);
				setCurrentGiftName(null);
				return;
			}

			setCurrentGiftName(giftName);
		} catch (error) {
			let errorMessage = "Не удалось начать мониторинг";

			if (typeof error === "object" && error !== null) {
				if (
					"data" in error &&
					typeof error.data === "object" &&
					error.data !== null
				) {
					// @ts-ignore
					if (error.data?.status === "not_found") {
						errorMessage = `Подарок "${giftName}" не найден`;
					} else {
						// @ts-ignore
						errorMessage = error.data?.error || errorMessage;
					}
				}
			}

			setError(errorMessage);
			setCurrentGiftName(null);
			console.error("Failed to start monitoring:", error);
		}
	};

	const giftExamples = ["WitchHat", "PartySparkler", "HomemadeCake"];

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<h1 className="text-2xl font-bold mb-6">Мониторинг подарков</h1>

					<GiftMonitorStatus status={status} lastMaxId={lastMaxId} />

					<GiftMonitorInput onSubmit={handleStartMonitoring} error={error} />
				</div>

				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50 mt-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">Формат ввода подарков</h2>
					<p className="text-gray-300 mb-4">
						Введите название подарка точно как указано в списке ниже. Названия
						чувствительны к регистру и должны быть написаны слитно, в формате
						PascalCase.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{giftExamples.map((gift) => (
							<div
								key={gift}
								className="bg-gray-700/40 px-4 py-2 rounded-lg font-mono text-green-400"
							>
								{gift}
							</div>
						))}
						<div className="bg-gray-700/40 px-4 py-2 rounded-lg font-mono text-green-400">
							... и другие подарки из NFT-коллекции
						</div>
					</div>
				</div>
				<GiftMonitorList updates={updates} />
			</div>
		</div>
	);
};
