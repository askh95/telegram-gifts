// src/pages/NFTGiftList.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGetNFTGiftsQuery } from "../store/api/nft";
import { NFTGiftCard } from "../components/NFTGiftCard";
import { RefreshCcw, Loader } from "lucide-react";
import { NFTGift } from "../types/nft";

export const NFTGiftList = () => {
	const navigate = useNavigate();
	const [allGifts, setAllGifts] = useState<NFTGift[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const observer = useRef<IntersectionObserver | null>(null);
	const loaderRef = useRef<HTMLDivElement | null>(null);

	const {
		data: giftResponse,
		isLoading: isInitialLoading,
		isFetching,
		error,
		refetch,
	} = useGetNFTGiftsQuery({
		page: currentPage,
		limit: 5,
	});

	useEffect(() => {
		if (giftResponse && giftResponse.gifts && giftResponse.gifts.length > 0) {
			if (currentPage === 1) {
				setAllGifts(giftResponse.gifts);
			} else {
				const existingIds = new Set(allGifts.map((gift) => gift._id));

				const newUniqueGifts = giftResponse.gifts.filter(
					(gift) => !existingIds.has(gift._id)
				);

				setAllGifts((prev) => [...prev, ...newUniqueGifts]);
			}

			setHasMore(currentPage < giftResponse.pagination.totalPages);
			setIsLoadingMore(false);
		} else if (
			giftResponse &&
			giftResponse.gifts &&
			giftResponse.gifts.length === 0
		) {
			setHasMore(false);
			setIsLoadingMore(false);
		}
	}, [giftResponse, currentPage]);

	const lastElementRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (!node || isFetching || isLoadingMore) return;

			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (
						entries[0].isIntersecting &&
						hasMore &&
						!isFetching &&
						!isLoadingMore
					) {
						setIsLoadingMore(true);

						setTimeout(() => {
							setCurrentPage((prev) => prev + 1);
						}, 300);
					}
				},
				{
					threshold: 0.5,
					rootMargin: "100px",
				}
			);

			observer.current.observe(node);
		},
		[hasMore, isFetching, isLoadingMore]
	);

	const handleGiftClick = (id: string) => {
		const gift = allGifts.find((g) => g._id === id);
		if (gift) {
			navigate(`/nft/${gift.name}/owners`);
		}
	};

	if (isInitialLoading && currentPage === 1) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	if (error && allGifts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
				<div className="text-red-400 text-xl">Не удалось загрузить NFT</div>
				<button
					onClick={() => {
						setCurrentPage(1);
						refetch();
					}}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
				>
					<RefreshCcw className="w-4 h-4" />
					Повторить
				</button>
			</div>
		);
	}

	return (
		<div className="bg-gray-900 text-white p-6 mb-5">
			<div className="max-w-7xl mx-auto">
				{allGifts && allGifts.length > 0 ? (
					<div className="flex flex-col gap-4">
						{allGifts.map((gift, index) => {
							const isNearEnd = index === allGifts.length - 3;
							return (
								<div key={gift._id} ref={isNearEnd ? lastElementRef : null}>
									<NFTGiftCard
										gift={gift}
										onClick={() => handleGiftClick(gift._id)}
									/>
								</div>
							);
						})}

						<div
							ref={loaderRef}
							className="w-full py-4 flex justify-center items-center"
						>
							{isFetching || isLoadingMore ? (
								<div className="flex items-center gap-3 text-gray-300 py-2">
									<Loader className="w-5 h-5 text-blue-500 animate-spin" />
									<span>Загрузка...</span>
								</div>
							) : hasMore ? (
								""
							) : allGifts.length > 0 && currentPage > 1 ? (
								<div className="text-center text-gray-500 text-sm">
									Больше подарков нет
								</div>
							) : null}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-gray-400">
						<div className="text-xl mb-2">NFT не найдены</div>
					</div>
				)}
			</div>
		</div>
	);
};
