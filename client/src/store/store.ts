import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { giftsApi } from "./api/gifts";
import { monitorApi } from "./api/monitor";
import { nftApi } from "./api/nft";

export const store = configureStore({
	reducer: {
		[giftsApi.reducerPath]: giftsApi.reducer,
		[monitorApi.reducerPath]: monitorApi.reducer,
		[nftApi.reducerPath]: nftApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			giftsApi.middleware,
			monitorApi.middleware,
			nftApi.middleware
		),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
