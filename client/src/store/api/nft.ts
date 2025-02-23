// src/store/api/nft.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	NFTGift,
	Owner,
	Model,
	ModelOwner,
	PaginatedResponse,
} from "../../types/nft";

const BASE_URL = import.meta.env.VITE_NFT_API;

export const nftApi = createApi({
	reducerPath: "nftApi",
	baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
	tagTypes: ["NFTGifts", "Owners", "Models"],
	endpoints: (builder) => ({
		getNFTGifts: builder.query<NFTGift[], void>({
			query: () => "gifts",
			providesTags: ["NFTGifts"],
		}),

		getGiftOwners: builder.query<
			PaginatedResponse<Owner>,
			{
				giftName: string;
				page?: number;
				limit?: number;
				search?: string;
			}
		>({
			query: ({ giftName, page = 1, limit = 20, search = "" }) => ({
				url: `gifts/${giftName}/owners`,
				params: { page, limit, search },
			}),
			providesTags: ["Owners"],
		}),

		getGiftModels: builder.query<
			PaginatedResponse<Model>,
			{
				giftName: string;
				page?: number;
				limit?: number;
				search?: string;
			}
		>({
			query: ({ giftName, page = 1, limit = 1000, search = "" }) => ({
				url: `gifts/${giftName}/models`,
				params: { page, limit, search },
			}),
			providesTags: ["Models"],
		}),

		getModelOwners: builder.query<
			PaginatedResponse<ModelOwner>,
			{
				giftName: string;
				modelName: string;
				page?: number;
				limit?: number;
			}
		>({
			query: ({ giftName, modelName, page = 1, limit = 30 }) => ({
				url: `gifts/${giftName}/models/${modelName}`,
				params: { page, limit },
			}),
			providesTags: ["Owners"],
		}),

		getModelImage: builder.query<
			{ imageUrl: string },
			{ giftName: string; modelName: string }
		>({
			query: ({ giftName, modelName }) =>
				`gifts/${giftName}/models/${encodeURIComponent(modelName)}/image`,
		}),
	}),
});

export const {
	useGetNFTGiftsQuery,
	useGetGiftOwnersQuery,
	useGetGiftModelsQuery,
	useGetModelOwnersQuery,
} = nftApi;
