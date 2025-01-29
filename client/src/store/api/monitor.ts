import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface StartMonitoringRequest {
	gift_name: string;
}

interface StartMonitoringResponse {
	gift_name: string;
	status: string;
}

export const monitorApi = createApi({
	reducerPath: "monitorApi",
	baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3003" }),
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
	}),
});

export const { useStartMonitoringMutation } = monitorApi;
