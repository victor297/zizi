import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/reviews`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery,
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: "",
        method: "POST",
        body: reviewData,
      }),
      invalidatesTags: ["Review"],
    }),
    getReceivedReviews: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/received/${userId}`,
        params: { page, limit },
      }),
      providesTags: ["Review"],
    }),
    getGivenReviews: builder.query({
      query: ({ page = 1, limit = 20 }) => ({
        url: "/given",
        params: { page, limit },
      }),
      providesTags: ["Review"],
    }),
    getReviewStats: builder.query({
      query: (userId) => `/stats/${userId}`,
      providesTags: ["Review"],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: ["Review"],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useGetReceivedReviewsQuery,
  useGetGivenReviewsQuery,
  useGetReviewStatsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
