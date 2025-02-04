interface NFTCardProps {
	id: string;
	name: string;
	onSelect: (name: string) => void;
	isSelected?: boolean;
}

export const NFTCard = ({ name, onSelect, isSelected }: NFTCardProps) => {
	const formattedName = name.replace(/[^a-zA-Z]/g, "");

	return (
		<div
			className={`
        relative overflow-hidden rounded-xl bg-gray-800/50 border
        ${isSelected ? "border-blue-500" : "border-gray-700/50"}
        transition-all duration-200 hover:scale-[1.02] group
      `}
		>
			<div className="absolute  bg-gradient-to-b from-transparent to-gray-900/90 z-10" />

			<div className="relative p-4 z-20">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold text-white truncate">{name}</h3>
				</div>

				<button
					onClick={() => onSelect(formattedName)}
					className={`
            w-full py-2 px-4 rounded-lg font-medium transition-colors
            ${
							isSelected
								? "bg-blue-500 text-white"
								: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
						}
          `}
				>
					{isSelected ? "Мониторинг активен" : "Начать мониторинг"}
				</button>
			</div>
		</div>
	);
};
