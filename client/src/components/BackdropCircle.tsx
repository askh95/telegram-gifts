// src/components/BackdropCircle.tsx
interface BackdropCircleProps {
	centerColor: string;
	edgeColor: string;
	size?: "small" | "medium" | "large";
	className?: string;
}

const BackdropCircle = ({
	centerColor,
	edgeColor,
	size = "small",
	className = "",
}: BackdropCircleProps) => {
	const sizeClasses = {
		small: "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8",
		medium: "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9",
		large: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12",
	};

	return (
		<div
			className={`${sizeClasses[size]} mr-1 sm:mr-2 rounded-full overflow-hidden ${className}`}
		>
			<div
				className="w-full h-full"
				style={{
					background: `radial-gradient(circle, ${centerColor} 0%, ${edgeColor} 100%)`,
				}}
			/>
		</div>
	);
};

export default BackdropCircle;
