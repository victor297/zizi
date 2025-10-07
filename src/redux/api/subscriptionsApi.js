import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/subscriptions`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const subscriptionsApi = createApi({
  reducerPath: "subscriptionsApi",
  baseQuery,
  tagTypes: ["SubscriptionPlan", "UserSubscription"],
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query({
      query: () => "/plans",
      providesTags: ["SubscriptionPlan"],
    }),
    getCurrentSubscription: builder.query({
      query: () => "/current",
      providesTags: ["UserSubscription"],
    }),
    subscribe: builder.mutation({
      query: (subscriptionData) => ({
        url: "/subscribe",
        method: "POST",
        body: subscriptionData,
      }),
      invalidatesTags: ["UserSubscription"],
    }),
    cancelSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: "/cancel",
        method: "PUT",
        body: { subscription_id: subscriptionId },
      }),
      invalidatesTags: ["UserSubscription"],
    }),
    checkCanPost: builder.query({
      query: () => "/can-post",
      providesTags: ["UserSubscription"],
    }),
    // Admin endpoints
    getAdminPlans: builder.query({
      query: () => "/admin/plans",
      providesTags: ["SubscriptionPlan"],
    }),
    createPlan: builder.mutation({
      query: (planData) => ({
        url: "/admin/plans",
        method: "POST",
        body: planData,
      }),
      invalidatesTags: ["SubscriptionPlan"],
    }),
    updatePlan: builder.mutation({
      query: ({ id, ...planData }) => ({
        url: `/admin/plans/${id}`,
        method: "PUT",
        body: planData,
      }),
      invalidatesTags: ["SubscriptionPlan"],
    }),
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/admin/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubscriptionPlan"],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetCurrentSubscriptionQuery,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
  useCheckCanPostQuery,
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = subscriptionsApi;
