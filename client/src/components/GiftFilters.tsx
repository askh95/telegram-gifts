import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type SortOption =
	| "lowest_remaining"
	| "highest_remaining"
	| "lowest_stars"
	| "highest_stars"
	| "none";

type StatusOption = "all" | "active" | "sold_out";

interface GiftFiltersProps {
	onFilterChange: (sortBy: SortOption) => void;
	onStatusChange: (status: StatusOption) => void;
}

export const GiftFilters = ({
	onFilterChange,
	onStatusChange,
}: GiftFiltersProps) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const [isQuantityMenuOpen, setIsQuantityMenuOpen] = useState(false);
	const [isStarsMenuOpen, setIsStarsMenuOpen] = useState(false);

	const handleSortChange = (value: SortOption) => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (value === "none") {
				newParams.delete("sort");
			} else {
				newParams.set("sort", value);
			}
			return newParams;
		});
		onFilterChange(value);
		setIsQuantityMenuOpen(false);
		setIsStarsMenuOpen(false);
	};

	const handleStatusChange = (value: StatusOption) => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (value === "all") {
				newParams.delete("status");
			} else {
				newParams.set("status", value);
			}
			return newParams;
		});
		onStatusChange(value);
		setIsStatusMenuOpen(false);
	};

	const handleReset = () => {
		setSearchParams(new URLSearchParams());
		onFilterChange("none");
		onStatusChange("all");
	};

	const currentSort = (searchParams.get("sort") as SortOption) || "none";
	const currentStatus = (searchParams.get("status") as StatusOption) || "all";

	const getQuantityButtonText = () => {
		switch (currentSort) {
			case "lowest_remaining":
				return "По возрастанию";
			case "highest_remaining":
				return "По убыванию";
			default:
				return "По количеству";
		}
	};

	const getStarsButtonText = () => {
		switch (currentSort) {
			case "lowest_stars":
				return "По возрастанию";
			case "highest_stars":
				return "По убыванию";
			default:
				return "По цене";
		}
	};

	const buttonClass = `
        relative bg-gray-800 text-gray-300 px-4 py-2 rounded-lg font-medium 
        hover:bg-gray-700 transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
        flex items-center gap-2
    `;

	const activeButtonClass = "!bg-blue-500/20 !text-blue-300";

	const menuClass =
		"absolute top-full mt-1 left-0 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]";

	const menuItemClass =
		"px-4 py-2 hover:bg-gray-700 transition-all duration-200 cursor-pointer text-gray-300 w-full text-left";

	return (
		<div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 mb-6 relative z-40">
			<div className="absolute -top-3 left-4">
				<div className="bg-gray-700 px-3 py-1 rounded-md">
					<span className="text-white font-medium">Фильтры</span>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-4 mt-4">
				<div className="relative">
					<button
						onClick={() => {
							setIsStatusMenuOpen(!isStatusMenuOpen);
							setIsQuantityMenuOpen(false);
							setIsStarsMenuOpen(false);
						}}
						className={`${buttonClass} ${
							currentStatus !== "all" ? activeButtonClass : ""
						}`}
					>
						{currentStatus === "all"
							? "Все подарки"
							: currentStatus === "active"
							? "Активные"
							: "Проданные"}
						<ChevronDown className="w-5 h-5" />
					</button>
					{isStatusMenuOpen && (
						<div className={menuClass}>
							<button
								onClick={() => handleStatusChange("all")}
								className={`${menuItemClass} ${
									currentStatus === "all" ? "bg-blue-500/20" : ""
								}`}
							>
								Все подарки
							</button>
							<button
								onClick={() => handleStatusChange("active")}
								className={`${menuItemClass} ${
									currentStatus === "active" ? "bg-blue-500/20" : ""
								}`}
							>
								Активные
							</button>
							<button
								onClick={() => handleStatusChange("sold_out")}
								className={`${menuItemClass} ${
									currentStatus === "sold_out" ? "bg-blue-500/20" : ""
								}`}
							>
								Проданные
							</button>
						</div>
					)}
				</div>

				<div className="relative">
					<button
						onClick={() => {
							setIsQuantityMenuOpen(!isQuantityMenuOpen);
							setIsStatusMenuOpen(false);
							setIsStarsMenuOpen(false);
						}}
						className={`${buttonClass} ${
							currentSort === "lowest_remaining" ||
							currentSort === "highest_remaining"
								? activeButtonClass
								: ""
						}`}
					>
						{getQuantityButtonText()}
						<ChevronDown className="w-5 h-5" />
					</button>
					{isQuantityMenuOpen && (
						<div className={menuClass}>
							<button
								onClick={() => handleSortChange("lowest_remaining")}
								className={`${menuItemClass} ${
									currentSort === "lowest_remaining" ? "bg-blue-500/20" : ""
								}`}
							>
								По возрастанию
							</button>
							<button
								onClick={() => handleSortChange("highest_remaining")}
								className={`${menuItemClass} ${
									currentSort === "highest_remaining" ? "bg-blue-500/20" : ""
								}`}
							>
								По убыванию
							</button>
						</div>
					)}
				</div>

				<div className="relative">
					<button
						onClick={() => {
							setIsStarsMenuOpen(!isStarsMenuOpen);
							setIsStatusMenuOpen(false);
							setIsQuantityMenuOpen(false);
						}}
						className={`${buttonClass} ${
							currentSort === "lowest_stars" || currentSort === "highest_stars"
								? activeButtonClass
								: ""
						}`}
					>
						{getStarsButtonText()}
						<ChevronDown className="w-5 h-5" />
					</button>
					{isStarsMenuOpen && (
						<div className={menuClass}>
							<button
								onClick={() => handleSortChange("lowest_stars")}
								className={`${menuItemClass} ${
									currentSort === "lowest_stars" ? "bg-blue-500/20" : ""
								}`}
							>
								По возрастанию
							</button>
							<button
								onClick={() => handleSortChange("highest_stars")}
								className={`${menuItemClass} ${
									currentSort === "highest_stars" ? "bg-blue-500/20" : ""
								}`}
							>
								По убыванию
							</button>
						</div>
					)}
				</div>

				{(currentSort !== "none" || currentStatus !== "all") && (
					<button
						onClick={handleReset}
						className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200 flex items-center gap-2"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						Сбросить
					</button>
				)}
			</div>
		</div>
	);
};
