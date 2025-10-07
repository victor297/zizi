import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/business`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const businessApi = createApi({
  reducerPath: "businessApi",
  baseQuery,
  tagTypes: ["BusinessProfile"],
  endpoints: (builder) => ({
    getBusinessProfile: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["BusinessProfile"],
    }),
    getMyBusinessProfile: builder.query({
      query: () => "/my-profile",
      providesTags: ["BusinessProfile"],
    }),
    updateBusinessProfile: builder.mutation({
      query: (profileData) => ({
        url: "/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["BusinessProfile"],
    }),
    deleteBusinessProfile: builder.mutation({
      query: () => ({
        url: "/profile",
        method: "DELETE",
      }),
      invalidatesTags: ["BusinessProfile"],
    }),
  }),
});

export const {
  useGetBusinessProfileQuery,
  useGetMyBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useDeleteBusinessProfileMutation,
} = businessApi;
