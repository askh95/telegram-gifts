import { useEffect, useRef, useState } from "react";
import { useGetModelOwnersQuery } from "../store/api/nft";
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
				className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ease-in-out
          ${
						isVisible
							? "opacity-100 pointer-events-auto"
							: "opacity-0 pointer-events-none"
					}`}
				onClick={handleClose}
			>
				<div
					className={`bg-gray-800/95 rounded-xl border border-gray-700/50 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl transition-all duration-200 ease-in-out
            ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
						<h2 className="text-lg font-medium text-white flex items-center gap-3">
							<Layers className="w-4 h-4 text-gray-400" />
							{modelName}
							{data?.modelInfo && (
								<span className="text-sm text-gray-400 font-normal">
									{data.modelInfo.ownersCount} владельцев
								</span>
							)}
						</h2>
						<button
							onClick={handleClose}
							className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
						>
							<X className="w-4 h-4 text-gray-400 hover:text-white" />
						</button>
					</div>

					<div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
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
