import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { adsApi } from './api/adsApi';
import { categoriesApi } from './api/categoriesApi';
import { adminApi } from './api/adminApi';
import { chatApi } from './api/chatApi';
import { paymentsApi } from './api/paymentsApi';
import { subscriptionsApi } from './api/subscriptionsApi';
import { savedSearchesApi } from './api/savedSearchesApi';
import { followsApi } from './api/followsApi';
import { reviewsApi } from './api/reviewsApi';
import { businessApi } from './api/businessApi';
import { settingsApi } from './api/settingsApi';
import authSlice from './slices/authSlice';
import adSlice from './slices/adSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    // API slices
    [authApi.reducerPath]: authApi.reducer,
    [adsApi.reducerPath]: adsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [subscriptionsApi.reducerPath]: subscriptionsApi.reducer,
    [savedSearchesApi.reducerPath]: savedSearchesApi.reducer,
    [followsApi.reducerPath]: followsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [businessApi.reducerPath]: businessApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    
    // Regular slices
    auth: authSlice,
    ads: adSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      adsApi.middleware,
      categoriesApi.middleware,
      adminApi.middleware,
      chatApi.middleware,
      paymentsApi.middleware,
      subscriptionsApi.middleware,
      savedSearchesApi.middleware,
      followsApi.middleware,
      reviewsApi.middleware,
      businessApi.middleware,
      settingsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;