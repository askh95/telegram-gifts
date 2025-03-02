// src/components/BackdropCircle.tsx
interface BackdropCircleProps {
	centerColor: string;
	edgeColor: string;
	size?: "small";
	className?: string;
}

const BackdropCircle = ({
	centerColor,
	edgeColor,
	className = "",
}: BackdropCircleProps) => {
	const sizeClasses = {
		small: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
	};

	return (
		<div
			className={`${sizeClasses["small"]} mr-1 sm:mr-2 rounded-full overflow-hidden ${className}`}
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
