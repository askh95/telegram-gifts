import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { giftsApi } from "./api/gifts";
import { monitorApi } from "./api/monitor";
import { nftApi } from "./api/nft";
import { nftSearchApi } from "./api/nftSearch";
import nftVisualizerReducer from "./slices/nftVisualizerSlice";

export const store = configureStore({
	reducer: {
		[giftsApi.reducerPath]: giftsApi.reducer,
		[monitorApi.reducerPath]: monitorApi.reducer,
		[nftApi.reducerPath]: nftApi.reducer,

		[nftSearchApi.reducerPath]: nftSearchApi.reducer,

		nftVisualizer: nftVisualizerReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			giftsApi.middleware,
			monitorApi.middleware,
			nftApi.middleware,
			nftSearchApi.middleware
		),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
