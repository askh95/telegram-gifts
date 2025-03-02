// src/pages/NFTSearchPage.tsx
import { useState, useEffect } from "react";
import SearchForm from "../components/SearchForm";
import GiftVisualizer from "../components/GiftVisualizer";
import SearchResults from "../components/SearchResults";
import { useAppSelector } from "../hooks/redux";
import { selectIsPreviewMode } from "../store/slices/nftVisualizerSlice";

const NFTSearchPage = () => {
	const isPreviewMode = useAppSelector(selectIsPreviewMode);
	const [isMobile, setIsMobile] = useState(false);
	const [viewportHeight, setViewportHeight] = useState(0);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
			setViewportHeight(window.innerHeight);
		};

		handleResize();

		window.addEventListener("resize", handleResize);
		window.addEventListener("scroll", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleResize);
		};
	}, []);

	return (
		<div className="bg-gray-900 text-white p-4 sm:p-6 min-h-screen">
			<div className="max-w-7xl mx-auto">
				{isMobile ? (
					<div
						className="grid grid-cols-1 bg-gray-800/20 p-3 border border-gray-700/50 backdrop-blur-sm overflow-hidden rounded-2xl shadow-lg gap-2 mb-4"
						style={{
							maxHeight: viewportHeight ? `${viewportHeight - 32}px` : "auto",
						}}
					>
						<div
							className="bg-gray-800/20 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-gray-700/50"
							style={{
								height: "50vw", // Половина ширины экрана вместо aspect-square
								maxHeight: viewportHeight
									? `${(viewportHeight - 32) / 2.2}px`
									: "40vh",
							}}
						>
							<GiftVisualizer />
						</div>

						<div
							className="rounded-3xl border-gray-700/50 overflow-auto"
							style={{
								maxHeight: viewportHeight
									? `${(viewportHeight - 32) / 2}px`
									: "45vh",
							}}
						>
							<SearchForm />
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div className="bg-gray-800/20 backdrop-blur-sm rounded-xl xl:rounded-3xl overflow-hidden shadow-lg border border-gray-700/50 aspect-square">
							<GiftVisualizer />
						</div>

						<div className="bg-gray-800/20 backdrop-blur-sm rounded-xl xl:rounded-3xl overflow-hidden shadow-lg border border-gray-700/50 md:aspect-square">
							<SearchForm />
						</div>
					</div>
				)}

				{isPreviewMode && <SearchResults />}
			</div>
		</div>
	);
};

export default NFTSearchPage;
