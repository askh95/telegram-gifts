// src/components/PatternIcon.tsx
import { formatGiftName } from "../utils/formatGiftName";

interface PatternIconProps {
	giftName: string;
	patternName: string;
	size?: "small" | "medium" | "large";
	className?: string;
}

const PatternIcon = ({
	giftName,
	patternName,
	size = "small",
	className = "",
}: PatternIconProps) => {
	const sizeClasses = {
		small: "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8",
		medium: "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9",
		large: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12",
	};

	const formattedGiftName = encodeURIComponent(formatGiftName(giftName));

	return (
		<div
			className={`${sizeClasses[size]} mr-1 sm:mr-2 rounded-full bg-white flex items-center justify-center overflow-hidden ${className}`}
		>
			<img
				src={`https://cdn.changes.tg/gifts/patterns/${formattedGiftName}/png/${patternName}.png`}
				alt={patternName}
				className="w-4/5 sm:w-5/6 h-4/5 sm:h-5/6 object-contain"
				onError={(e) => {
					e.currentTarget.style.display = "none";
				}}
			/>
		</div>
	);
};

export default PatternIcon;
