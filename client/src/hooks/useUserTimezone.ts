import { useState, useEffect } from "react";

export const useUserTimezone = () => {
	const [timezone, setTimezone] = useState({
		offset: 0,
		name: "UTC",
	});

	useEffect(() => {
		const offset = new Date().getTimezoneOffset();
		const hours = -(offset / 60);

		const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

		setTimezone({
			offset: hours,
			name: timezoneName || `UTC${hours >= 0 ? "+" : ""}${hours}`,
		});
	}, []);

	return timezone;
};
