// src/store/api/monitor.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GIFT_NAMES } from "../../constants/giftNames";

interface StartMonitoringRequest {
	gift_name: string;
}

interface StartMonitoringResponse {
	gift_name: string;
	status: string;
}

export const monitorApi = createApi({
	reducerPath: "monitorApi",
	baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_RUST_API }),
	endpoints: (builder) => ({
		startMonitoring: builder.mutation<
			StartMonitoringResponse,
			StartMonitoringRequest
		>({
			query: (body) => ({
				url: "/check",
				method: "POST",
				body,
			}),
		}),
		getGiftNames: builder.query<typeof GIFT_NAMES, void>({
			queryFn: () => {
				// Return local data instead of making an HTTP request
				const reversedEntries = [...Object.entries(GIFT_NAMES)].reverse();
				return {
					data: Object.fromEntries(reversedEntries),
				};
			},
		}),
	}),
});

export const { useStartMonitoringMutation, useGetGiftNamesQuery } = monitorApi;
