// src/store/api/gifts.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	Gift,
	GiftDetails,
	GiftStats,
	GiftHistory,
	GiftSticker,
} from "../../types/gift";

export const giftsApi = createApi({
	reducerPath: "giftsApi",
	baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api" }),
	endpoints: (builder) => ({
		getGifts: builder.query<Gift[], void>({
			query: () => "/gifts",
			transformResponse: (response: { data: Gift[] }) => response.data,
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
		getGiftSticker: builder.query<GiftSticker, string>({
			query: (id) => `/gifts/${id}/sticker`,
		}),
	}),
});

export const {
	useGetGiftsQuery,
	useGetGiftByIdQuery,
	useGetGiftStatsQuery,
	useGetGiftHistoryQuery,
	useGetGiftStickerQuery,
} = giftsApi;
