// src/components/GiftIcon.tsx
import { useGetGiftModelsQuery } from "../store/api/nft";

interface GiftIconProps {
	giftName: string;
	size?: "small" | "medium" | "large";
	className?: string;
}

const GiftIcon = ({
	giftName,
	size = "small",
	className = "",
}: GiftIconProps) => {
	const sizeClasses = {
		small: "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8",
		medium: "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9",
		large: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12",
	};

	const { data: modelsData } = useGetGiftModelsQuery(
		{
			giftName: giftName,
			page: 1,
			limit: 1,
		},
		{
			skip: !giftName,
		}
	);

	if (!modelsData?.models?.[0]) return null;

	return (
		<img
			src={`${import.meta.env.VITE_NFT_API}/gifts/${giftName}/models/${
				modelsData.models[0].name
			}/image`}
			alt={giftName}
			className={`${sizeClasses[size]} mr-1 sm:mr-2 object-contain ${className}`}
			onError={(e) => {
				e.currentTarget.style.display = "none";
			}}
		/>
	);
};

export default GiftIcon;
