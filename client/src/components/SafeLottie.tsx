//  src/components/SafeLottie.tsx
import React, { useState } from "react";
import Lottie, { LottieComponentProps } from "lottie-react";
import { AlertTriangle } from "lucide-react";

interface SafeLottieProps extends LottieComponentProps {
	fallback?: React.ReactNode;
	sizeVariant?: "small" | "medium" | "large";
}

const SafeLottie = ({
	fallback,
	sizeVariant = "medium",
	...props
}: SafeLottieProps) => {
	const [hasError, setHasError] = useState(false);

	const sanitizedAnimationData = React.useMemo(() => {
		try {
			if (!props.animationData) return null;

			const safeData = JSON.parse(JSON.stringify(props.animationData));

			if (safeData.layers) {
				safeData.layers = safeData.layers.map((layer: any) => {
					if (layer && typeof layer === "object") {
						const cleanLayer = { ...layer };

						["completed", "isLoaded", "loadedImages"].forEach((prop) => {
							if (prop in cleanLayer) {
								delete cleanLayer[prop];
							}
						});

						return cleanLayer;
					}
					return layer;
				});
			}

			return safeData;
		} catch (error) {
			console.error("Error sanitizing Lottie data:", error);
			setHasError(true);
			return null;
		}
	}, [props.animationData]);

	const iconSizeClasses = {
		small: "w-4 h-4",
		medium: "w-6 h-6",
		large: "w-8 h-8",
	};

	const textSizeClasses = {
		small: "text-xs",
		medium: "text-sm",
		large: "text-base",
	};

	if (hasError || !sanitizedAnimationData) {
		return (
			fallback || (
				<div className="flex flex-col items-center justify-center h-full">
					<AlertTriangle
						className={`${iconSizeClasses[sizeVariant]} text-yellow-500 mb-1`}
					/>
					<p className={`${textSizeClasses[sizeVariant]} text-gray-400`}>
						Ошибка анимации
					</p>
				</div>
			)
		);
	}

	return (
		<Lottie
			{...props}
			animationData={sanitizedAnimationData}
			loop={true}
			onError={() => {
				console.error("Lottie animation error");
				setHasError(true);
			}}
		/>
	);
};

export default SafeLottie;
