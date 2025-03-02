// src/components/ModelImage.tsx
interface ModelImageProps {
	giftName: string;
	modelName: string;
	size?: "small" | "medium" | "large";
	className?: string;
}

const ModelImage = ({
	giftName,
	modelName,
	className = "",
}: ModelImageProps) => {
	const sizeClasses = {
		small: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
	};

	return (
		<div
			className={`${sizeClasses["small"]} rounded-md overflow-hidden mr-1 sm:mr-2 inline-block align-middle shadow-sm ${className}`}
		>
			<img
				src={`${
					import.meta.env.VITE_NFT_API
				}/gifts/${giftName}/models/${modelName}/image`}
				alt={modelName}
				className="w-full h-full object-cover"
				onError={(e) => {
					e.currentTarget.style.display = "none";
				}}
			/>
		</div>
	);
};

export default ModelImage;
