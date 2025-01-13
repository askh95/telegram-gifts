import { Activity } from "lucide-react";
import type { GiftHistory as GiftHistoryType } from "../types/gift";

interface GiftHistoryProps {
	history: GiftHistoryType[];
}

export const GiftHistory = ({ history }: GiftHistoryProps) => {
	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
			<div className="flex items-center gap-2 mb-4">
				<h3 className="text-xl font-bold text-white">История изменений</h3>
				<Activity className="h-5 w-5 text-purple-400" />
			</div>

			<div className="space-y-4">
				{history.map((item, index) => (
					<div
						key={item.last_updated}
						className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 flex flex-col gap-2"
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

						<div className="flex items-center justify-between">
							<span className="text-gray-300 text-sm sm:text-xs">
								{item.last_updated} <u>UTC +0</u>
							</span>
							<span className="text-sm font-medium">{item.emoji}</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex flex-col">
								<span className="text-gray-400 text-sm">Изменение</span>
								<span
									className={`font-medium ${
										Math.abs(item.change_amount) !== item.change_amount
											? "text-green-400"
											: "text-red-400"
									}`}
								>
									{Math.abs(item.change_amount) !== item.change_amount
										? "+"
										: "-"}
									{Math.abs(item.change_amount).toLocaleString()}
								</span>
							</div>

							<div className="flex flex-col items-end">
								<span className="text-gray-400 text-sm">Осталось</span>
								<span className="text-white font-medium">
									{item.remaining_count.toLocaleString()}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
