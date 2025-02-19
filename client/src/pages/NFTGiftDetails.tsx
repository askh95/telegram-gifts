import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGetGiftOwnersQuery, useGetGiftModelsQuery } from "../store/api/nft";
import { Users, Layers, ArrowLeft, Loader } from "lucide-react";
import { OwnerCard } from "../components/OwnerCard";
import { ModelsList } from "../components/ModelsList";
import { ModelOwnersModal } from "../components/ModelOwnersModal";
import type { Owner } from "../types/nft";
import { useDebounce } from "../hooks/useDebounce";
import { OwnersSearch } from "../components/OwnersSearch";

type TabType = "OWNERS" | "MODELS";

const TABS = {
	OWNERS: "OWNERS",
	MODELS: "MODELS",
} as const;

const ITEMS_PER_PAGE = 20;

export const NFTGiftDetails = () => {
	const { giftName } = useParams<{ giftName: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const isOwnersPath = location.pathname.endsWith("/owners");
	const loaderRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const [activeTab, setActiveTab] = useState<TabType>(
		isOwnersPath ? TABS.OWNERS : TABS.MODELS
	);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [allOwners, setAllOwners] = useState<Owner[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearch = useDebounce(searchQuery, 300);

	const {
		data: ownersData,
		isFetching: isOwnersLoading,
		isError: isOwnersError,
	} = useGetGiftOwnersQuery(
		{
			giftName: giftName || "",
			page: currentPage,
			limit: ITEMS_PER_PAGE,
			search: debouncedSearch,
		},
		{
			skip: !giftName || activeTab !== TABS.OWNERS,
		}
	);

	const { data: modelsData, isLoading: isModelsLoading } =
		useGetGiftModelsQuery(
			{
				giftName: giftName || "",
				page: 1,
				limit: 1000,
				search: debouncedSearch,
			},
			{ skip: !giftName || activeTab !== TABS.MODELS }
		);

	useEffect(() => {
		setCurrentPage(1);
		setHasMore(true);
		setAllOwners([]);
	}, [debouncedSearch, activeTab, giftName]);

	useEffect(() => {
		if (ownersData?.owners) {
			if (currentPage === 1) {
				setAllOwners(ownersData.owners);
			} else {
				setAllOwners((prev) => [...prev, ...(ownersData.owners || [])]);
			}

			const totalPages = ownersData.pagination?.totalPages || 1;
			setHasMore(currentPage < totalPages);
		}
	}, [ownersData, currentPage]);

	useEffect(() => {
		if (observerRef.current) {
			observerRef.current.disconnect();
		}

		if (
			activeTab !== TABS.OWNERS ||
			!hasMore ||
			isOwnersLoading ||
			isOwnersError
		)
			return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				const firstEntry = entries[0];
				if (firstEntry.isIntersecting && hasMore && !isOwnersLoading) {
					setCurrentPage((prev) => prev + 1);
				}
			},
			{ threshold: 0.1 }
		);

		const currentLoader = loaderRef.current;
		if (currentLoader) {
			observerRef.current.observe(currentLoader);
		}

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [hasMore, isOwnersLoading, activeTab]);

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		setCurrentPage(1);
		setHasMore(true);
		setAllOwners([]);
		const path = tab === TABS.OWNERS ? "owners" : "models";
		navigate(`/nft/${giftName}/${path}`);
	};

	const uniqueOwners = useMemo(() => {
		return Array.from(
			new Map(
				allOwners.map((owner) => [
					`${owner.username}-${owner.displayName}`,
					owner,
				])
			).values()
		);
	}, [allOwners]);

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<div className="max-w-7xl mx-auto p-6">
				<div className="mb-8 flex items-center gap-4">
					<button
						onClick={() => navigate("/nft")}
						className="p-2 hover:bg-gray-800 rounded-lg transition-all group"
					>
						<ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
					</button>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-semibold text-white">{giftName}</h1>
						{ownersData?.pagination?.totalOwners && (
							<span className="text-gray-400 text-sm">
								{ownersData.pagination.totalOwners.toLocaleString()} владельцев
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-3 mb-6">
					<TabButton
						isActive={activeTab === TABS.OWNERS}
						onClick={() => handleTabChange(TABS.OWNERS)}
						icon={<Users className="w-4 h-4" />}
						label="Владельцы"
					/>
					<TabButton
						isActive={activeTab === TABS.MODELS}
						onClick={() => handleTabChange(TABS.MODELS)}
						icon={<Layers className="w-4 h-4" />}
						label="Модели"
					/>
				</div>

				<div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
					{activeTab === TABS.OWNERS && (
						<div className="divide-y divide-gray-700/50">
							<OwnersSearch onSearch={setSearchQuery} />
							{isOwnersLoading && currentPage === 1 ? (
								<div className="flex justify-center p-8">
									<Loader className="w-8 h-8 text-gray-400 animate-spin" />
								</div>
							) : isOwnersError ? (
								<div className="p-8 text-center">
									<div className="mb-3 text-red-500">
										Произошла ошибка при загрузке данных
									</div>
								</div>
							) : (
								<>
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
											{isOwnersLoading && (
												<Loader className="w-6 h-6 text-gray-400 animate-spin" />
											)}
										</div>
									)}

									{!allOwners.length && !isOwnersLoading && (
										<div className="p-8 text-center text-gray-400">
											Владельцы не найдены
										</div>
									)}

									{!hasMore && allOwners.length > 0 && (
										<div className="p-4 text-center text-gray-400 text-sm">
											Больше владельцев нет
										</div>
									)}
								</>
							)}
						</div>
					)}

					{activeTab === TABS.MODELS && (
						<div className="divide-y divide-gray-700/50">
							{isModelsLoading ? (
								<div className="flex justify-center p-8">
									<Loader className="w-8 h-8 text-gray-400 animate-spin" />
								</div>
							) : (
								<ModelsList
									models={modelsData?.models || []}
									onModelSelect={setSelectedModel}
									onSearch={setSearchQuery}
									isLoading={isModelsLoading}
								/>
							)}
						</div>
					)}
				</div>
			</div>

			{selectedModel && (
				<ModelOwnersModal
					giftName={giftName || ""}
					modelName={selectedModel}
					onClose={() => setSelectedModel(null)}
				/>
			)}
		</div>
	);
};

interface TabButtonProps {
	isActive: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
}

const TabButton = ({ isActive, onClick, icon, label }: TabButtonProps) => (
	<button
		onClick={onClick}
		className={`
      flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium 
      transition-all duration-200 border
      ${
				isActive
					? "bg-gray-800 text-white border-gray-700"
					: "bg-transparent text-gray-400 border-transparent hover:bg-gray-800/50 hover:text-white"
			}
    `}
	>
		{icon}
		{label}
	</button>
);

export default NFTGiftDetails;
