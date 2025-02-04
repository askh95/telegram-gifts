import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { GiftMonitorStatus } from "../components/GiftMonitorStatus";
// import { GiftMonitorList } from "../components/GiftMonitorList";
import {
	useStartMonitoringMutation,
	useGetGiftNamesQuery,
} from "../store/api/monitor";
import { NFTCard } from "../components/NFTCard";
import ActiveUsers from "../components/ActiveUsers";

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
	const { data: giftNames } = useGetGiftNamesQuery();

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
					...prev.slice(0, 29),
				]);
			}
		},
		[currentGiftName]
	);

	useEffect(() => {
		setUpdates([]);
	}, [currentGiftName]);

	const { status } = useWebSocket({
		url: import.meta.env.VITE_RUST_WS,
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

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<div className="flex justify-between gap-4 mb-6">
						<h1 className="text-2xl font-bold">Мониторинг подарков</h1>
						<ActiveUsers />
					</div>
					<GiftMonitorStatus
						status={status}
						lastMaxId={lastMaxId}
						currentGiftName={currentGiftName}
					/>
				</div>

				<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
					<p className="text-yellow-200/90 text-sm">
						Внимание: Если вы хотите начать мониторинг другого подарка,
						пожалуйста, перезагрузите страницу. Смена подарка без перезагрузки
						может привести к некорректной работе мониторинга.
					</p>
				</div>
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Object.entries(giftNames || {}).map(([id, name]) => (
							<NFTCard
								key={id}
								id={id}
								name={name}
								onSelect={handleStartMonitoring}
								isSelected={currentGiftName === name.replace(/[^a-zA-Z]/g, "")}
							/>
						))}
					</div>
				</div>

				{error && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				{/* <GiftMonitorList updates={updates} /> */}
			</div>
		</div>
	);
};
