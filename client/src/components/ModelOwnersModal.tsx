import { useEffect, useRef, useState } from "react";
import {
	useGetModelOwnersQuery,
	useGetModelImageQuery,
} from "../store/api/nft";
import { OwnerCard } from "./OwnerCard";
import { Layers, X, Loader } from "lucide-react";
import type { ModelOwner } from "../types/nft";
import Portal from "./Portal";

interface ModelOwnersModalProps {
	giftName: string;
	modelName: string;
	onClose: () => void;
}

export const ModelOwnersModal = ({
	giftName,
	modelName,
	onClose,
}: ModelOwnersModalProps) => {
	const [page, setPage] = useState(1);
	const [allOwners, setAllOwners] = useState<ModelOwner[]>([]);
	const [isVisible, setIsVisible] = useState(false);
	const loaderRef = useRef<HTMLDivElement>(null);
	const ITEMS_PER_PAGE = 20;

	const { data: imageData } = useGetModelImageQuery({
		giftName,
		modelName,
	});

	const { data, isLoading, isFetching } = useGetModelOwnersQuery(
		{
			giftName,
			modelName,
			page,
			limit: ITEMS_PER_PAGE,
		},
		{
			skip: !giftName || !modelName,
		}
	);

	const currentPage = data?.pagination?.currentPage ?? 1;
	const totalPages = data?.pagination?.totalPages ?? 1;
	const hasMore = currentPage < totalPages;

	useEffect(() => {
		document.body.style.overflow = "hidden";
		setTimeout(() => setIsVisible(true), 10);
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	useEffect(() => {
		if (data?.owners) {
			if (page === 1) {
				setAllOwners(data.owners);
			} else {
				setAllOwners((prev) => [...prev, ...(data.owners || [])]);
			}
		}
	}, [data?.owners, page]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isFetching) {
					setPage((p) => p + 1);
				}
			},
			{ threshold: 0.1 }
		);

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			if (loaderRef.current) {
				observer.unobserve(loaderRef.current);
			}
		};
	}, [hasMore, isFetching]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, []);

	const handleClose = () => {
		setIsVisible(false);
		setTimeout(onClose, 200);
	};

	const uniqueOwners = Array.from(
		new Map(
			allOwners.map((owner) => [
				`${owner.username}-${owner.displayName}`,
				owner,
			])
		).values()
	);

	return (
		<Portal>
			<div
				className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 
          transition-opacity duration-200 ease-in-out
          ${
						isVisible
							? "opacity-100 pointer-events-auto"
							: "opacity-0 pointer-events-none"
					}`}
				onClick={handleClose}
			>
				<div
					className={`bg-gray-800/95 rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[80vh] 
            overflow-hidden shadow-xl transition-all duration-200 ease-in-out
            ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="relative">
						{/* Blur Background */}
						<div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />

						{/* Header Content */}
						<div className="relative p-6 border-b border-gray-700/50 flex items-center gap-6">
							{/* Model Image */}
							<div className="relative group">
								<div
									className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                               rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-all duration-300"
								/>
								{imageData?.imageUrl ? (
									<div
										className="relative w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-white/10 
                                 group-hover:ring-white/20 transition-all"
									>
										<img
											src={`${import.meta.env.VITE_NFT_API.replace(
												"/api/nft",
												""
											)}${imageData.imageUrl}`}
											alt={modelName}
											className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
											}}
										/>
									</div>
								) : (
									<div
										className="relative w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 
                                 flex items-center justify-center ring-1 ring-white/10 
                                 group-hover:ring-white/20 transition-all"
									>
										<Layers className="w-10 h-10 text-white/90" />
									</div>
								)}
							</div>

							{/* Title and Stats */}
							<div className="flex-1">
								<h2 className="text-xl font-semibold text-white mb-2">
									{modelName}
								</h2>
								{data?.modelInfo && (
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-full">
											<div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
											<span className="text-sm text-purple-200/70">
												{data.modelInfo.ownersCount.toLocaleString()} владельцев
											</span>
										</div>
										<div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full">
											<div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
											<span className="text-sm text-blue-200/70">
												{data.modelInfo.totalGifts?.toLocaleString()} подарков
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Close Button */}
							<button
								onClick={handleClose}
								className="p-2 hover:bg-gray-700/50 rounded-lg transition-all 
                         absolute top-4 right-4"
							>
								<X className="w-5 h-5 text-gray-400 hover:text-white" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
						{isLoading && page === 1 ? (
							<div className="flex justify-center p-8">
								<Loader className="w-8 h-8 text-gray-400 animate-spin" />
							</div>
						) : (
							<div className="divide-y divide-gray-700/50">
								{uniqueOwners.map((owner, index) => (
									<OwnerCard
										key={`${owner.username || ""}-${
											owner.displayName
										}-${index}`}
										owner={owner}
										giftName={giftName}
										index={index + 1}
									/>
								))}

								{hasMore && (
									<div ref={loaderRef} className="flex justify-center p-4">
										{isFetching ? (
											<Loader className="w-6 h-6 text-gray-400 animate-spin" />
										) : null}
									</div>
								)}

								{uniqueOwners.length === 0 && !isLoading && (
									<div className="p-8 text-center text-gray-400">
										Владельцы не найдены
									</div>
								)}

								{!hasMore && uniqueOwners.length > 0 && (
									<div className="p-4 text-center text-gray-400 text-sm">
										Больше владельцев нет
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</Portal>
	);
};
