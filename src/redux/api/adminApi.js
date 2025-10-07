import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/admin`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: ["AdminUser", "AdminAd", "AdminCategory", "Analytics"],
  endpoints: (builder) => ({
    // User Management
    getUsers: builder.query({
      query: (params) => ({
        url: "/users",
        params,
      }),
      providesTags: ["AdminUser"],
    }),
    getUser: builder.query({
      query: (userId) => `/users/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "AdminUser", id: userId },
      ],
    }),
    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AdminUser"],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUser"],
    }),

    // Ad Management
    getAllAds: builder.query({
      query: (params) => ({
        url: "/ads",
        params,
      }),
      providesTags: ["AdminAd"],
    }),
    updateAdStatus: builder.mutation({
      query: ({ adId, status }) => ({
        url: `/ads/${adId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AdminAd"],
    }),
    featureAdAdmin: builder.mutation({
      query: ({ adId, featured }) => ({
        url: `/ads/${adId}/feature`,
        method: "PUT",
        body: { featured },
      }),
      invalidatesTags: ["AdminAd"],
    }),

    // Category Management
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: "/categories",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["AdminCategory"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: categoryData,
      }),
      invalidatesTags: ["AdminCategory"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminCategory"],
    }),
    getAdminCategories: builder.query({
      query: () => "/categories",
      providesTags: ["AdminCategory"],
    }),

    // Analytics
    getAnalytics: builder.query({
      query: (timeframe) => ({
        url: "/analytics",
        params: { timeframe },
      }),
      providesTags: ["Analytics"],
    }),
    getStats: builder.query({
      query: () => "/stats",
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAllAdsQuery,
  useUpdateAdStatusMutation,
  useFeatureAdAdminMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useGetAnalyticsQuery,
  useGetStatsQuery,
} = adminApi;
