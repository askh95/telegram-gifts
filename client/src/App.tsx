import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { GiftList } from "./pages/GiftList";
import { GiftDetails } from "./pages/GiftDetails";
import DonatePage from "./pages/DonatePage";
import { NFTGiftList } from "./pages/NFTGiftList";
import NFTGiftDetails from "./pages/NFTGiftDetails";
import NFTSearchPage from "./pages/NFTSearchPage";
import DonateModal from "./components/DonateModal";
import useDonateModal from "./hooks/useDonateModal";

function App() {
	const { showModal, closeModal } = useDonateModal();

	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Navigate to="/gifts" replace />} />
					<Route path="/gifts" element={<GiftList />} />
					<Route path="/gifts/:id" element={<GiftDetails />} />
					<Route path="/donate" element={<DonatePage />} />
					<Route path="/nft" element={<NFTGiftList />} />
					<Route path="/nft/:giftName/*" element={<NFTGiftDetails />} />
					<Route path="/search" element={<NFTSearchPage />} />
				</Routes>

				{showModal && <DonateModal onClose={closeModal} />}
			</Layout>
		</Router>
	);
}

export default App;
