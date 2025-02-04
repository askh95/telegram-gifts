import { useState, useEffect } from "react";
import { Users } from "lucide-react";

const ActiveUsers = () => {
	const [userCount, setUserCount] = useState(0);

	useEffect(() => {
		const tabId = `tab_${Math.random().toString(36).substr(2, 9)}`;

		const updateActivity = () => {
			const now = Date.now();
			localStorage.setItem(tabId, now.toString());

			let activeCount = 0;
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("tab_")) {
					const timestamp = parseInt(localStorage.getItem(key) || "0");
					if (now - timestamp < 5000) {
						activeCount++;
					} else {
						localStorage.removeItem(key);
					}
				}
			});

			setUserCount(activeCount);
		};

		const interval = setInterval(updateActivity, 5000);

		updateActivity();

		return () => {
			clearInterval(interval);
			localStorage.removeItem(tabId);
		};
	}, []);

	return (
		<div className="">
			<div className="group relative">
				<div className="flex items-center gap-2 rounded-full bg-gray-900/95 px-4 py-2 text-sm font-medium text-gray-100 shadow-lg ring-1 ring-gray-800 backdrop-blur-sm transition-all duration-300 hover:ring-blue-500">
					<Users className="h-4 w-4 text-blue-500" />
					<span className="inline-flex items-center gap-1">
						<span className="font-semibold text-blue-500">{userCount}</span>
					</span>
				</div>
			</div>
		</div>
	);
};

export default ActiveUsers;
