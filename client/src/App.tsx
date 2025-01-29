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
import { GiftMonitorPage } from "./pages/GiftMonitorPage";

function App() {
	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Navigate to="/gifts" replace />} />
					<Route path="/gifts" element={<GiftList />} />
					<Route path="/gifts/:id" element={<GiftDetails />} />
					<Route path="/donate" element={<DonatePage />} />
					<Route path="/monitor" element={<GiftMonitorPage />} />
				</Routes>
			</Layout>
		</Router>
	);
}

export default App;
