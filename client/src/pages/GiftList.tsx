import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useGetGiftsQuery } from "../store/api/gifts";
import { GiftCard } from "../components/GiftCard";
import { RefreshCcw } from "lucide-react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export const GiftList: FC = () => {
	const navigate = useNavigate();
	const { data: gifts, isLoading, error, refetch } = useGetGiftsQuery();

	useAutoRefresh(() => {
		refetch();
	});

	const handleGiftClick = (id: string) => {
		navigate(`/gift/${id}`);
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
				<div className="text-red-400 text-xl">Не удалось загрузить подарки</div>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
				>
					Повторить
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">Доступные подарки</h1>
					<div className="text-gray-400 text-sm flex items-center gap-2">
						<RefreshCcw className="h-4 w-4" />
						Последнее обновление: {new Date().toLocaleString()}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{gifts?.map((gift) => (
						<GiftCard
							key={gift.telegram_id}
							gift={gift}
							onClick={handleGiftClick}
						/>
					))}
				</div>

				{gifts?.length === 0 && (
					<div className="text-center text-gray-400 mt-8">
						На данный момент подарков нет
					</div>
				)}
			</div>
		</div>
	);
};
