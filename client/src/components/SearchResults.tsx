import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "../hooks/redux";
import { selectSearchQuery } from "../store/slices/nftVisualizerSlice";
import { useSearchGiftsQuery } from "../store/api/nftSearch";
import { Loader, AlertCircle } from "lucide-react";
import { SearchResult } from "../types/nft";

const SearchResults = () => {
	const searchQuery = useAppSelector(selectSearchQuery);
	const [allResults, setAllResults] = useState<SearchResult[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [loadedMoreThanOnePage, setLoadedMoreThanOnePage] = useState(false);
	const observer = useRef<IntersectionObserver | null>(null);
	const loaderRef = useRef<HTMLDivElement>(null);
	const tableRef = useRef<HTMLDivElement>(null);
	const desktopLoaderRef = useRef<HTMLDivElement>(null);

	const uniqueResultIds = useRef(new Set<string>());

	const {
		data: searchResults,
		isLoading: isInitialLoading,
		isFetching,
		error,
		refetch,
	} = useSearchGiftsQuery(
		{
			name: searchQuery.name || "",
			model: searchQuery.model || undefined,
			pattern: searchQuery.pattern || undefined,
			backdrop: searchQuery.backdrop || undefined,
			page: currentPage,
			limit: 20,
		},
		{
			skip: !searchQuery.name,
		}
	);

	useEffect(() => {
		if (
			searchResults &&
			searchResults.results &&
			searchResults.results.length > 0
		) {
			if (currentPage === 1) {
				uniqueResultIds.current.clear();
				setLoadedMoreThanOnePage(false);

				searchResults.results.forEach((result) => {
					uniqueResultIds.current.add(`${result.giftNumber}-${result.owner}`);
				});

				setAllResults(searchResults.results);
			} else {
				setLoadedMoreThanOnePage(true);

				const newUniqueResults = searchResults.results.filter((result) => {
					const resultId = `${result.giftNumber}-${result.owner}`;
					if (!uniqueResultIds.current.has(resultId)) {
						uniqueResultIds.current.add(resultId);
						return true;
					}
					return false;
				});

				setAllResults((prev) => [...prev, ...newUniqueResults]);
			}

			setHasMore(currentPage < searchResults.pagination.totalPages);
			setIsLoadingMore(false);
		} else if (
			searchResults &&
			searchResults.results &&
			searchResults.results.length === 0
		) {
			setHasMore(false);
			setIsLoadingMore(false);
		}
	}, [searchResults, currentPage]);

	useEffect(() => {
		setCurrentPage(1);
		setAllResults([]);
		setHasMore(true);
		setLoadedMoreThanOnePage(false);
		uniqueResultIds.current.clear();
	}, [
		searchQuery.name,
		searchQuery.model,
		searchQuery.pattern,
		searchQuery.backdrop,
	]);

	const lastMobileElementRef = useCallback(
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

	useEffect(() => {
		if (!desktopLoaderRef.current || isFetching || isLoadingMore || !hasMore)
			return;

		const observerDesktop = new IntersectionObserver(
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
				threshold: 0.1,
				rootMargin: "200px 0px",
			}
		);

		observerDesktop.observe(desktopLoaderRef.current);

		return () => {
			if (desktopLoaderRef.current) {
				observerDesktop.disconnect();
			}
		};
	}, [hasMore, isFetching, isLoadingMore, allResults.length]);

	if (!searchQuery.name) {
		return (
			<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-700/50 mb-6">
				<div className="text-center text-gray-400 py-6">
					Выберите подарок и другие параметры для поиска
				</div>
			</div>
		);
	}

	if (isInitialLoading && currentPage === 1) {
		return (
			<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-700/50 mb-6">
				<div className="flex flex-col items-center justify-center py-12 gap-4">
					<div className="relative w-16 h-16">
						<Loader className="w-16 h-16 text-blue-500 animate-spin opacity-75" />
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-10 h-10 bg-gray-800/90 rounded-full"></div>
						</div>
					</div>
					<span className="text-gray-300 font-medium animate-pulse">
						Загрузка результатов...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-700/50 mb-6">
				<div className="flex flex-col items-center justify-center text-red-400 py-6 gap-2">
					<AlertCircle className="w-8 h-8 text-red-400" />
					<p className="text-center">
						Произошла ошибка при загрузке результатов
					</p>
					<button
						onClick={() => {
							setCurrentPage(1);
							refetch();
						}}
						className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
					>
						Попробовать снова
					</button>
				</div>
			</div>
		);
	}

	if (
		(!searchResults || searchResults.results.length === 0) &&
		allResults.length === 0
	) {
		return (
			<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-700/50 mb-6">
				<div className="text-xs md:text-lg text-center text-gray-400 py-6">
					По вашему запросу ничего не найдено
				</div>
			</div>
		);
	}

	return (
		<div
			ref={tableRef}
			className="bg-gray-800/50 backdrop-blur-sm rounded-xl xl:rounded-3xl p-4 md:p-6 shadow-lg border border-gray-700/50 mb-6 transition-all duration-300"
		>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
				<h2 className="text-base md:text-xl font-bold text-white">
					Результаты поиска
				</h2>
				<div className="text-xs md:text-sm text-gray-400 flex items-center gap-3">
					{searchResults && (
						<>
							<span>Найдено: {searchResults.pagination.totalItems}</span>
						</>
					)}
				</div>
			</div>

			<div className="hidden md:block overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gray-700/30">
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50 w-10">
								№
							</th>
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50">
								Номер
							</th>
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50">
								Владелец
							</th>
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50">
								Модель
							</th>
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50">
								Фон
							</th>
							<th className="px-4 py-2 text-left text-gray-300 border-b border-gray-600/50">
								Узор
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-600/30">
						{allResults.map((result, index) => {
							const rowKey = `${result.giftNumber}-${result.owner}-${index}`;
							return (
								<tr
									key={rowKey}
									className="hover:bg-gray-700/20 transition-colors duration-150"
								>
									<td className="px-4 py-3 text-gray-400">{index + 1}</td>
									<td className="px-4 py-3 text-white font-medium">
										<a
											href={`https://t.me/nft/${searchQuery.name}-${result.giftNumber}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-400 hover:text-blue-300 hover:underline"
										>
											#{result.giftNumber}
										</a>
									</td>
									<td className="px-4 py-3 text-white">
										{result.username ? (
											<a
												href={`https://${result.username.replace("@", "")}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-400 hover:text-blue-300 hover:underline"
											>
												{result.owner}
											</a>
										) : result.owner.startsWith("UQ") &&
										  result.owner.length >= 48 ? (
											<a
												href={`https://tonviewer.com/${result.owner}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-400 hover:text-blue-300 hover:underline"
											>
												{`${result.owner.substring(
													0,
													4
												)}...${result.owner.substring(
													result.owner.length - 4
												)}`}
											</a>
										) : (
											result.owner
										)}
									</td>
									<td className="px-4 py-3 text-gray-300">{result.model}</td>
									<td className="px-4 py-3 text-gray-300">{result.backdrop}</td>
									<td className="px-4 py-3 text-gray-300">{result.pattern}</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{allResults.length > 0 && (
					<div ref={desktopLoaderRef} className="h-4 w-full" />
				)}
			</div>

			<div className="md:hidden space-y-4">
				{allResults.map((result, index) => {
					const cardKey = `mobile-${result.giftNumber}-${result.owner}-${index}`;
					return (
						<div
							key={cardKey}
							className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30"
							ref={
								index === allResults.length - 5 ? lastMobileElementRef : null
							}
						>
							<div className="flex justify-between items-center mb-2">
								<span className="text-gray-400 text-sm">№{index + 1}</span>
								<a
									href={`https://t.me/nft/${searchQuery.name}-${result.giftNumber}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 text-base font-medium hover:text-blue-300 hover:underline"
								>
									{result.giftNumber}
								</a>
							</div>

							<div className="grid grid-cols-1 gap-2 text-xs">
								<div className="flex justify-between">
									<span className="text-gray-400">Владелец:</span>
									<span className="text-white text-right">
										{result.username ? (
											<a
												href={`https://${result.username.replace("@", "")}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-400 hover:text-blue-300 hover:underline"
											>
												{result.owner}
											</a>
										) : result.owner.startsWith("UQ") &&
										  result.owner.length >= 48 ? (
											<a
												href={`https://tonviewer.com/${result.owner}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-400 hover:text-blue-300 hover:underline"
											>
												{`${result.owner.substring(
													0,
													4
												)}...${result.owner.substring(
													result.owner.length - 4
												)}`}
											</a>
										) : (
											result.owner
										)}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="text-gray-400">Модель:</span>
									<span className="text-gray-300 text-right">
										{result.model}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="text-gray-400">Фон:</span>
									<span className="text-gray-300 text-right">
										{result.backdrop}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="text-gray-400">Узор:</span>
									<span className="text-gray-300 text-right">
										{result.pattern}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div
				ref={loaderRef}
				className="w-full py-1 flex justify-center items-center mt-2"
			>
				{isFetching || isLoadingMore ? (
					<div className="flex items-center gap-3 text-gray-300 py-2">
						<Loader className="w-5 h-5 text-blue-500 animate-spin" />
						<span>Загрузка...</span>
					</div>
				) : hasMore ? (
					""
				) : allResults.length > 0 && loadedMoreThanOnePage ? (
					<div className="text-center text-gray-500 text-sm">
						Больше результатов нет
					</div>
				) : null}
			</div>
		</div>
	);
};

export default SearchResults;
