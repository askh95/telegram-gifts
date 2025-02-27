// src/pages/NFTSearchPage.tsx
import SearchForm from "../components/SearchForm";
import GiftVisualizer from "../components/GiftVisualizer";
import SearchResults from "../components/SearchResults";
import { useAppSelector } from "../hooks/redux";
import { selectIsPreviewMode } from "../store/slices/nftVisualizerSlice";

const NFTSearchPage = () => {
	const isPreviewMode = useAppSelector(selectIsPreviewMode);

	return (
		<div className="bg-gray-900 text-white p-4 sm:p-6">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
					<div className="bg-gray-800/20 backdrop-blur-sm rounded-xl xl:rounded-3xl overflow-hidden shadow-lg border border-gray-700/50 aspect-square">
						<GiftVisualizer />
					</div>

					<div className="bg-gray-800/20 backdrop-blur-sm rounded-xl xl:rounded-3xl overflow-hidden shadow-lg border border-gray-700/50 md:aspect-square">
						<SearchForm />
					</div>
				</div>

				{isPreviewMode && <SearchResults />}
			</div>
		</div>
	);
};

export default NFTSearchPage;
