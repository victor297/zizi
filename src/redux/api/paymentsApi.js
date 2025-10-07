import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/payments`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const paymentsApi = createApi({
  reducerPath: "paymentsApi",
  baseQuery,
  tagTypes: ["Payment"],
  endpoints: (builder) => ({
    initializePayment: builder.mutation({
      query: (paymentData) => ({
        url: "/initialize",
        method: "POST",
        body: paymentData,
      }),
    }),
    verifyPayment: builder.query({
      query: (reference) => `/verify/${reference}`,
      providesTags: ["Payment"],
    }),
    getServicePrices: builder.query({
      query: () => "/prices",
    }),
    getPaymentHistory: builder.query({
      query: () => "/history",
      providesTags: ["Payment"],
    }),
    createPaymentIntent: builder.mutation({
      query: ({ adId, service, amount }) => ({
        url: "/intent",
        method: "POST",
        body: { adId, service, amount },
      }),
    }),
  }),
});

export const {
  useInitializePaymentMutation,
  useVerifyPaymentQuery,
  useGetServicePricesQuery,
  useGetPaymentHistoryQuery,
  useCreatePaymentIntentMutation,
} = paymentsApi;
