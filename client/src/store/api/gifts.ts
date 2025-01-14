import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	Gift,
	GiftDetails,
	GiftStats,
	GiftHistory,
	GiftsQueryParams,
	PaginatedResponse,
} from "../../types/gift";

export const giftsApi = createApi({
	reducerPath: "giftsApi",
	baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
	endpoints: (builder) => ({
		getGifts: builder.query<PaginatedResponse<Gift>, GiftsQueryParams | void>({
			query: (params) => ({
				url: "/gifts",
				params: {
					minStars: params?.minStars ?? undefined,
					maxStars: params?.maxStars ?? undefined,
					minRemaining: params?.minRemaining ?? undefined,
					maxRemaining: params?.maxRemaining ?? undefined,
					status: params?.status ?? undefined,
					page: params?.page ?? 1,
					limit: 100,
				},
			}),
		}),
		getGiftById: builder.query<GiftDetails, string>({
			query: (id) => `/gifts/${id}`,
		}),
		getGiftStats: builder.query<GiftStats, string>({
			query: (id) => `/gifts/${id}/stats`,
		}),
		getGiftHistory: builder.query<
			GiftHistory[],
			{ id: string; limit?: number }
		>({
			query: ({ id, limit = 15 }) => `/gifts/${id}/history?limit=${limit}`,
			transformResponse: (response: { data: GiftHistory[] }) => response.data,
		}),
	}),
});

export const {
	useGetGiftsQuery,
	useGetGiftByIdQuery,
	useGetGiftStatsQuery,
	useGetGiftHistoryQuery,
} = giftsApi;
