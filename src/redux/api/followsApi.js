import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/follows`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const followsApi = createApi({
  reducerPath: "followsApi",
  baseQuery,
  tagTypes: ["Follow"],
  endpoints: (builder) => ({
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Follow"],
    }),
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Follow"],
    }),
    getFollowers: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/${userId}/followers`,
        params: { page, limit },
      }),
      providesTags: ["Follow"],
    }),
    getFollowing: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/${userId}/following`,
        params: { page, limit },
      }),
      providesTags: ["Follow"],
    }),
    getFollowStatus: builder.query({
      query: (userId) => `/${userId}/status`,
      providesTags: ["Follow"],
    }),
  }),
});

export const {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowStatusQuery,
} = followsApi;
