// src/pages/NFTGiftList.tsx
import { useNavigate } from "react-router-dom";
import { useGetNFTGiftsQuery } from "../store/api/nft";
import { NFTGiftCard } from "../components/NFTGiftCard";
import { RefreshCcw } from "lucide-react";

export const NFTGiftList = () => {
	const navigate = useNavigate();
	const { data: gifts, isLoading, error, refetch } = useGetNFTGiftsQuery();

	const handleGiftClick = (name: string) => {
		navigate(`/nft/${name}/owners`);
	};

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
				<div className="text-red-400 text-xl">Не удалось загрузить NFT</div>
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
		<div className="bg-gray-900 text-white p-6 mb-5">
			<div className="max-w-7xl mx-auto">
				{gifts && gifts.length > 0 ? (
					<div className="flex flex-col gap-4">
						{gifts.map((gift) => (
							<NFTGiftCard
								key={gift._id}
								gift={gift}
								onClick={() => handleGiftClick(gift.name)}
							/>
						))}
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
