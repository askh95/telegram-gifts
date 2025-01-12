import React, { FC } from "react";
import Lottie from "lottie-react";

interface TGStickerProps {
	fileUrl: string;
	size?: number;
	className?: string;
}

export const TGSticker: FC<TGStickerProps> = ({
	fileUrl,
	size = 128,
	className = "",
}) => {
	const [animationData, setAnimationData] = React.useState<any>(null);
	const [error, setError] = React.useState<boolean>(false);

	React.useEffect(() => {
		const loadSticker = async () => {
			try {
				// TGS файлы нужно сначала загрузить и распаковать
				const response = await fetch(fileUrl);
				const buffer = await response.arrayBuffer();

				// TGS это сжатый gzip, поэтому нам нужно его распаковать
				// Можно использовать pako для распаковки gzip
				// const unzipped = pako.ungzip(new Uint8Array(buffer));
				// const json = new TextDecoder().decode(unzipped);
				// const data = JSON.parse(json);

				// Временно, пока не добавим pako, просто пробуем загрузить как JSON
				const data = JSON.parse(new TextDecoder().decode(buffer));
				setAnimationData(data);
			} catch (err) {
				console.error("Failed to load sticker:", err);
				setError(true);
			}
		};

		if (fileUrl) {
			loadSticker();
		}
	}, [fileUrl]);

	if (error) {
		return (
			<div
				className={`flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`}
				style={{ width: size, height: size }}
			>
				⚠️
			</div>
		);
	}

	if (!animationData) {
		return (
			<div
				className={`flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`}
				style={{ width: size, height: size }}
			>
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	return (
		<Lottie
			animationData={animationData}
			loop={true}
			autoplay={true}
			style={{ width: size, height: size }}
			className={className}
		/>
	);
};
