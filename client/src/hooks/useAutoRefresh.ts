import { useEffect } from "react";

export const useAutoRefresh = (
	refreshFunction: () => void,
	interval: number = import.meta.env.VITE_UPDATE_INTERVAL
) => {
	useEffect(() => {
		const timer = setInterval(() => {
			refreshFunction();
		}, interval);

		return () => clearInterval(timer);
	}, [refreshFunction, interval]);
};
