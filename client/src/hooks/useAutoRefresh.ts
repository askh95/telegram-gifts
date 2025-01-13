import { useEffect } from "react";

export const useAutoRefresh = (
	refreshFunction: () => void,
	interval: number = 10000
) => {
	useEffect(() => {
		const timer = setInterval(() => {
			refreshFunction();
		}, interval);

		return () => clearInterval(timer);
	}, [refreshFunction, interval]);
};
