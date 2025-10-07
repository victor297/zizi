import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseurl } from "./constant";

const baseQuery = fetchBaseQuery({
  baseUrl: `${baseurl}/api/chat`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery,
  tagTypes: ["Conversation", "Message"],
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => "/conversations",
      providesTags: ["Conversation"],
    }),
    getConversation: builder.query({
      query: (id) => `/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),
    getMessages: builder.query({
      query: (conversationId) => `/conversations/${conversationId}/messages`,
      providesTags: (result, error, conversationId) => [
        { type: "Message", id: conversationId },
      ],
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, content, type = "text" }) => ({
        url: "/messages",
        method: "POST",
        body: { conversationId, content, type },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Message", id: conversationId },
        "Conversation",
      ],
    }),
    createConversation: builder.mutation({
      query: ({ recipientId, adId }) => ({
        url: "/conversations",
        method: "POST",
        body: { recipientId, adId },
      }),
      invalidatesTags: ["Conversation"],
    }),
    markAsRead: builder.mutation({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, conversationId) => [
        { type: "Conversation", id: conversationId },
      ],
    }),
    blockUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/block`,
        method: "POST",
      }),
      invalidatesTags: ["Conversation"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateConversationMutation,
  useMarkAsReadMutation,
  useBlockUserMutation,
} = chatApi;
