// src/store/api/monitor.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface StartMonitoringRequest {
	gift_name: string;
}

interface StartMonitoringResponse {
	gift_name: string;
	status: string;
}

interface GiftNameMapping {
	[key: string]: string;
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
		getGiftNames: builder.query<GiftNameMapping, void>({
			query: () => "https://cdn.changes.tg/gifts/id-to-name.json",
			transformResponse: (response: GiftNameMapping) => {
				const reversedEntries = [...Object.entries(response)].reverse();
				return Object.fromEntries(reversedEntries);
			},
		}),
	}),
});

export const { useStartMonitoringMutation, useGetGiftNamesQuery } = monitorApi;
