import { useState } from "react";
import { Gift } from "lucide-react";

interface GiftMonitorInputProps {
	onSubmit: (giftName: string) => Promise<void>;
	error: string | null;
}

export const GiftMonitorInput = ({
	onSubmit,
	error,
}: GiftMonitorInputProps) => {
	const [giftName, setGiftName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (giftName.trim() && !isSubmitting) {
			setIsSubmitting(true);
			try {
				await onSubmit(giftName.trim());
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	return (
		<div className="space-y-4">
			<form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<input
						type="text"
						value={giftName}
						onChange={(e) => setGiftName(e.target.value)}
						placeholder="Введите название подарка"
						className="w-full px-4 py-2 bg-gray-700/50 rounded-lg border border-gray-600/50 
                     text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
						disabled={isSubmitting}
					/>
				</div>
				<button
					type="submit"
					className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500 
                   hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 
                   disabled:cursor-not-allowed"
					disabled={isSubmitting}
				>
					<Gift className="w-5 h-5" />
					<span>{isSubmitting ? "Проверяем..." : "Начать мониторинг"}</span>
				</button>
			</form>

			<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
				<p className="text-yellow-200/90 text-sm">
					Внимание: Если вы хотите начать мониторинг другого подарка,
					пожалуйста, перезагрузите страницу. Смена подарка без перезагрузки
					может привести к некорректной работе мониторинга.
				</p>
			</div>

			{error && (
				<div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p className="text-red-400 text-sm">{error}</p>
				</div>
			)}
		</div>
	);
};
