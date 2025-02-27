// src/store/api/nftSearch.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { NFTGift, GiftBackdrop, SearchResults } from "../../types/nft";
import { formatGiftName } from "../../utils/formatGiftName";

const BASE_URL = import.meta.env.VITE_NFT_API;
const CDN_URL = "https://cdn.changes.tg";

export const nftSearchApi = createApi({
	reducerPath: "nftSearchApi",
	baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
	tagTypes: ["NFTGifts", "Patterns", "Backdrops", "Models", "SearchResults"],
	endpoints: (builder) => ({
		getNFTGifts: builder.query<NFTGift[], void>({
			query: () => "gifts",
			providesTags: ["NFTGifts"],
		}),

		getGiftPatterns: builder.query<string[], string>({
			query: (giftName) => `gifts/${giftName}/patterns`,
			providesTags: (_, __, giftName) => [{ type: "Patterns", id: giftName }],
		}),

		getGiftBackdrops: builder.query<string[], string>({
			query: (giftName) => `gifts/${giftName}/backdrops`,
			providesTags: (_, __, giftName) => [{ type: "Backdrops", id: giftName }],
		}),

		getGiftModelNames: builder.query<string[], string>({
			query: (giftName) => `gifts/${giftName}/model-names`,
			providesTags: (_, __, giftName) => [{ type: "Models", id: giftName }],
		}),
		searchGifts: builder.query<
			SearchResults,
			{
				name: string;
				model?: string;
				pattern?: string;
				backdrop?: string;
				page?: number;
				limit?: number;
			}
		>({
			query: (params) => ({
				url: `gifts/search`,
				params,
			}),
			providesTags: ["SearchResults"],
		}),

		getBackdropData: builder.query<GiftBackdrop[], string>({
			queryFn: async (giftName) => {
				try {
					const formattedGiftName = formatGiftName(giftName);
					const response = await fetch(
						`${CDN_URL}/gifts/backdrops/${encodeURIComponent(
							formattedGiftName
						)}/backdrops.json`
					);

					if (!response.ok) {
						throw new Error("Failed to fetch backdrop data");
					}

					const data = await response.json();
					return { data };
				} catch (error) {
					return { error: { status: "FETCH_ERROR", error: String(error) } };
				}
			},
		}),

		getPatternLottie: builder.query<
			any,
			{ giftName: string; patternName: string }
		>({
			queryFn: async ({ giftName, patternName }) => {
				try {
					const formattedGiftName = formatGiftName(giftName);

					const response = await fetch(
						`${CDN_URL}/gifts/patterns/${encodeURIComponent(
							formattedGiftName
						)}/lottie/${encodeURIComponent(patternName)}.json`
					);

					if (!response.ok) {
						throw new Error("Failed to fetch pattern lottie");
					}

					const data = await response.json();
					return { data };
				} catch (error) {
					return { error: { status: "FETCH_ERROR", error: String(error) } };
				}
			},
		}),

		getModelLottie: builder.query<any, { giftName: string; modelName: string }>(
			{
				queryFn: async ({ giftName, modelName }) => {
					try {
						const formattedGiftName = formatGiftName(giftName);

						const response = await fetch(
							`${CDN_URL}/gifts/models/${encodeURIComponent(
								formattedGiftName
							)}/lottie/${encodeURIComponent(modelName)}.json`
						);

						if (!response.ok) {
							throw new Error("Failed to fetch model lottie");
						}

						const data = await response.json();
						return { data };
					} catch (error) {
						return { error: { status: "FETCH_ERROR", error: String(error) } };
					}
				},
			}
		),

		getGiftNamesFromCDN: builder.query<Record<string, string>, void>({
			queryFn: async () => {
				try {
					const response = await fetch(`${CDN_URL}/gifts/id-to-name.json`);

					if (!response.ok) {
						throw new Error("Failed to fetch gift names from CDN");
					}

					const data = await response.json();
					return { data };
				} catch (error) {
					return { error: { status: "FETCH_ERROR", error: String(error) } };
				}
			},
		}),
	}),
});

export const {
	useGetNFTGiftsQuery,
	useGetGiftPatternsQuery,
	useGetGiftBackdropsQuery,
	useGetGiftModelNamesQuery,
	useSearchGiftsQuery,
	useGetBackdropDataQuery,
	useGetPatternLottieQuery,
	useGetModelLottieQuery,
	useGetGiftNamesFromCDNQuery,
} = nftSearchApi;
