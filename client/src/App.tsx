// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GiftList } from "./pages/GiftList";
import { GiftDetails } from "./pages/GiftDetails";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<GiftList />} />
				<Route path="/gift/:id" element={<GiftDetails />} />
			</Routes>
		</Router>
	);
}

export default App;
