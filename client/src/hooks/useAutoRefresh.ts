import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useAutoRefresh = (
	refreshFunction: () => void,
	interval: number = 1000
) => {
	useEffect(() => {
		const timer = setInterval(() => {
			refreshFunction();
		}, interval);

		return () => clearInterval(timer);
	}, [refreshFunction, interval]);
};
