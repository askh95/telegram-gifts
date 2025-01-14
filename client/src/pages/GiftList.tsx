import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetGiftsQuery } from "../store/api/gifts";
import { GiftCard } from "../components/GiftCard";
import { GiftFilters } from "../components/GiftFilters";
import { RefreshCcw } from "lucide-react";
import { Gift } from "../types/gift";

type SortOption =
	| "lowest_remaining"
	| "highest_remaining"
	| "lowest_stars"
	| "highest_stars"
	| "none";

type StatusOption = "all" | "active" | "sold_out";

export const GiftList = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const currentSort = (searchParams.get("sort") as SortOption) || "none";
	const currentStatus = (searchParams.get("status") as StatusOption) || "all";

	const {
		data: giftsResponse,
		isLoading,
		error,
		refetch,
	} = useGetGiftsQuery({
		limit: 20,
		status: currentStatus === "all" ? undefined : currentStatus,
	});

	const handleGiftClick = (id: string) => {
		navigate(`/gifts/${id}`);
	};

	const sortGifts = (gifts: Gift[], sortBy: SortOption): Gift[] => {
		if (sortBy === "none") {
			return gifts;
		}

		return [...gifts].sort((a, b) => {
			switch (sortBy) {
				case "lowest_remaining":
					return a.remaining_count - b.remaining_count;
				case "highest_remaining":
					return b.remaining_count - a.remaining_count;
				case "lowest_stars":
					return a.star_count - b.star_count;
				case "highest_stars":
					return b.star_count - a.star_count;
				default:
					return 0;
			}
		});
	};

	const handleFilterChange = (sortBy: SortOption) => {
		if (!giftsResponse?.data) return;
		return sortGifts(giftsResponse.data, sortBy);
	};

	const handleStatusChange = (_: StatusOption) => {};

	const sortedGifts = giftsResponse?.data
		? sortGifts(giftsResponse.data, currentSort)
		: [];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
				<div className="text-red-400 text-xl">Не удалось загрузить подарки</div>
				<button
					onClick={() => refetch()}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
				>
					<RefreshCcw className="w-4 h-4" />
					Повторить
				</button>
			</div>
		);
	}

	return (
		<div className=" bg-gray-900 text-white p-6 mb-5">
			<div className="max-w-7xl mx-auto">
				<GiftFilters
					onFilterChange={handleFilterChange}
					onStatusChange={handleStatusChange}
				/>

				{sortedGifts.length > 0 ? (
					<div className="flex flex-col gap-4">
						{sortedGifts.map((gift) => (
							<GiftCard
								key={gift.telegram_id}
								gift={gift}
								onClick={() => handleGiftClick(gift.telegram_id)}
							/>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-gray-400">
						<div className="text-xl mb-2">Подарки не найдены</div>
						<div className="text-sm">
							{currentStatus !== "all"
								? `Нет подарков со статусом "${
										currentStatus === "active" ? "активные" : "проданные"
								  }"`
								: "Попробуйте изменить параметры фильтрации"}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
