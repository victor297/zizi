import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/settings`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["UserSettings"],
  endpoints: (builder) => ({
    getUserSettings: builder.query({
      query: () => "",
      providesTags: ["UserSettings"],
    }),
    updateUserSettings: builder.mutation({
      query: (settingsData) => ({
        url: "",
        method: "PUT",
        body: settingsData,
      }),
      invalidatesTags: ["UserSettings"],
    }),
  }),
});

export const { useGetUserSettingsQuery, useUpdateUserSettingsMutation } =
  settingsApi;
