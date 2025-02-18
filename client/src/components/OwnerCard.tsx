import { useState, useMemo } from "react";
import { Owner } from "../types/nft";
import { ChevronDown, ChevronUp, Link, Gift } from "lucide-react";

interface OwnerCardProps {
	owner: Owner;
	giftName: string | undefined;
	index: number;
}

const INITIAL_NUMBERS_SHOW = 5;

export const OwnerCard = ({ owner, giftName, index }: OwnerCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showAllNumbers, setShowAllNumbers] = useState(false);

	const sortedNumbers = useMemo(() => {
		return [...owner.giftNumbers].sort((a, b) => a - b);
	}, [owner.giftNumbers]);

	const remainingNumbers = useMemo(() => {
		return sortedNumbers.slice(3);
	}, [sortedNumbers]);

	const visibleRemainingNumbers = useMemo(() => {
		if (showAllNumbers) return remainingNumbers;
		return remainingNumbers.slice(0, INITIAL_NUMBERS_SHOW);
	}, [remainingNumbers, showAllNumbers]);

	const hasMoreNumbers = remainingNumbers.length > INITIAL_NUMBERS_SHOW;

	const getPositionStyles = (position: number) => {
		if (position === 1)
			return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-500";
		if (position === 2)
			return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 text-gray-400";
		if (position === 3)
			return "bg-gradient-to-r from-amber-700/20 to-amber-800/20 text-amber-700";
		return "bg-gray-700/50 text-gray-400";
	};

	return (
		<div className="group p-6 hover:bg-gray-800/70 transition-all duration-200">
			<div className="flex items-start gap-4">
				{/* Номер в списке с градиентным фоном для топ-3 */}
				<div
					className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-gray-700/50 
            ${getPositionStyles(
							index
						)} font-bold text-lg transition-all duration-200`}
				>
					{index}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 max-w-[70%]">
							{!owner.isHidden ? (
								<a
									href={`https://${owner.username}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-gray-100 hover:text-white font-medium truncate group-hover:underline decoration-gray-500 underline-offset-2"
								>
									<span className="truncate">{owner.displayName}</span>
									<Link className="w-3.5 h-3.5 text-gray-500 shrink-0" />
								</a>
							) : (
								<span className="text-gray-300 font-medium truncate">
									{owner.displayName}
								</span>
							)}
						</div>

						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-300">
							<Gift className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">{owner.giftsCount}</span>
						</div>

						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="ml-auto p-2 hover:bg-gray-700/50 rounded-lg transition-all"
						>
							{isExpanded ? (
								<ChevronUp className="w-4 h-4 text-gray-400" />
							) : (
								<ChevronDown className="w-4 h-4 text-gray-400" />
							)}
						</button>
					</div>

					<div
						className={`grid transition-all duration-300 ${
							isExpanded ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"
						}`}
					>
						<div className="overflow-hidden">
							<div className="flex flex-wrap gap-2">
								{isExpanded && hasMoreNumbers && (
									<button
										onClick={() => setShowAllNumbers(!showAllNumbers)}
										className="px-3 py-1.5 text-xs font-medium bg-gray-700/50 hover:bg-gray-700 
                      text-gray-300 hover:text-white rounded-lg transition-all
                      border border-gray-700 hover:border-gray-600"
									>
										{showAllNumbers
											? "Показать меньше"
											: `Показать еще ${
													remainingNumbers.length - INITIAL_NUMBERS_SHOW
											  }`}
									</button>
								)}

								{/* Остальные номера */}
								{visibleRemainingNumbers.map((number) => (
									<a
										key={number}
										href={`https://t.me/nft/${giftName}-${number}`}
										target="_blank"
										rel="noopener noreferrer"
										className="px-3 py-1.5 text-xs font-medium bg-gray-700/50 hover:bg-gray-700 
                      text-gray-300 hover:text-white rounded-lg transition-all
                      border border-gray-700 hover:border-gray-600"
									>
										#{number}
									</a>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OwnerCard;
