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
	size = "small",
	className = "",
}: ModelImageProps) => {
	const sizeClasses = {
		small: "w-3 h-3 xl:w-6 xl:h-6 ",
		medium: "w-6 h-6 xl:w-8 xl:h-8",
		large: "w-8 h-8 xl:w-11 xl:h-11 ",
	};

	return (
		<div
			className={`${sizeClasses[size]} rounded-md overflow-hidden mr-1 sm:mr-2 inline-block align-middle shadow-sm ${className}`}
		>
			<img
				src={`${
					import.meta.env.VITE_NFT_API
				}/gifts/${giftName}/models/${modelName}/image`}
				alt={modelName}
				className="w-full h-full object-cover"
				onError={(e) => {
					e.currentTarget.src = "/placeholder-model.png";
				}}
			/>
		</div>
	);
};

export default ModelImage;
