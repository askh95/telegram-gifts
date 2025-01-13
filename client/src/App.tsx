import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { GiftList } from "./pages/GiftList";
import { GiftDetails } from "./pages/GiftDetails";
import Analytics from "./pages/Analytics";
import DonatePage from "./pages/DonatePage";

function App() {
	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Navigate to="/gifts" replace />} />
					<Route path="/gifts" element={<GiftList />} />
					<Route path="/gifts/:id" element={<GiftDetails />} />
					<Route path="/analytics" element={<Analytics />} />
					<Route path="/donate" element={<DonatePage />} />
				</Routes>
			</Layout>
		</Router>
	);
}

export default App;
