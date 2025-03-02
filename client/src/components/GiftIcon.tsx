// src/components/GiftIcon.tsx
interface GiftIconProps {
	giftName: string;
	size?: "small" | "medium" | "large";
	className?: string;
}

const GiftIcon = ({ giftName, className = "" }: GiftIconProps) => {
	const sizeClasses = {
		small: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
	};

	return (
		<img
			src={`${
				import.meta.env.VITE_NFT_API
			}/gifts/${giftName}/default-model-image`}
			alt={giftName}
			className={`${sizeClasses["small"]} mr-1 sm:mr-2 object-contain ${className}`}
			onError={(e) => {
				e.currentTarget.style.display = "none";
			}}
		/>
	);
};

export default GiftIcon;
