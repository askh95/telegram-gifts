// src/components/PatternIcon.tsx
import { formatGiftName } from "../utils/formatGiftName";

interface PatternIconProps {
	giftName: string;
	patternName: string;
	size?: "small";
	className?: string;
}

const PatternIcon = ({
	giftName,
	patternName,
	className = "",
}: PatternIconProps) => {
	const sizeClasses = {
		small: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
	};

	const formattedGiftName = encodeURIComponent(formatGiftName(giftName));

	return (
		<div
			className={`${sizeClasses["small"]} mr-1 sm:mr-2 rounded-full bg-white flex items-center justify-center overflow-hidden ${className}`}
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
