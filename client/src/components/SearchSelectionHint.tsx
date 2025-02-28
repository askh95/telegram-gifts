// src/components/SearchSelectionHint.tsx
import { Info } from "lucide-react";

interface SearchSelectionHintProps {
	hasGift: boolean;
	hasModel: boolean;
	hasPattern: boolean;
	hasBackdrop: boolean;
}

const SearchSelectionHint = ({
	hasGift,
	hasModel,
	hasPattern,
	hasBackdrop,
}: SearchSelectionHintProps) => {
	if (!hasGift) {
		return null;
	}

	if (hasModel || hasPattern || hasBackdrop) {
		return null;
	}

	return (
		<div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 animate-fadeIn">
			<div className="flex-shrink-0 mt-0.5">
				<Info className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
			</div>
			<div className="text-blue-300 text-xs lg:text-sm ">
				<p>
					Выберите хотя бы один из параметров{" "}
					<i className="text-blue-400">(Модель, Фон или Узор)</i> для поиска и
					визуализации.
				</p>
			</div>
			<style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
		</div>
	);
};

export default SearchSelectionHint;
