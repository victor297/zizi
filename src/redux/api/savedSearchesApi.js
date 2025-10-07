import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/saved-searches`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const savedSearchesApi = createApi({
  reducerPath: "savedSearchesApi",
  baseQuery,
  tagTypes: ["SavedSearch"],
  endpoints: (builder) => ({
    getSavedSearches: builder.query({
      query: () => "",
      providesTags: ["SavedSearch"],
    }),
    saveSearch: builder.mutation({
      query: (searchData) => ({
        url: "",
        method: "POST",
        body: searchData,
      }),
      invalidatesTags: ["SavedSearch"],
    }),
    updateSavedSearch: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: ["SavedSearch"],
    }),
    deleteSavedSearch: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SavedSearch"],
    }),
    deleteAllSavedSearches: builder.mutation({
      query: () => ({
        url: "",
        method: "DELETE",
      }),
      invalidatesTags: ["SavedSearch"],
    }),
  }),
});

export const {
  useGetSavedSearchesQuery,
  useSaveSearchMutation,
  useUpdateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useDeleteAllSavedSearchesMutation,
} = savedSearchesApi;
