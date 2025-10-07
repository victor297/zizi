import React, { useState } from "react";
import { Star, User, Calendar, MessageCircle } from "lucide-react";
import {
  useGetReceivedReviewsQuery,
  useGetGivenReviewsQuery,
  useGetReviewStatsQuery,
} from "../redux/api/reviewsApi";
import { useSelector } from "react-redux";

const Reviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("received");

  const { data: receivedReviewsResponse, isLoading: loadingReceived } =
    useGetReceivedReviewsQuery({
      userId: user?.id,
      page: 1,
      limit: 20,
    });

  const { data: givenReviewsResponse, isLoading: loadingGiven } =
    useGetGivenReviewsQuery({
      page: 1,
      limit: 20,
    });

  const { data: reviewStatsResponse } = useGetReviewStatsQuery(user?.id);

  const receivedReviews = receivedReviewsResponse?.data?.reviews || [];
  const givenReviews = givenReviewsResponse?.data?.reviews || [];
  const stats = reviewStatsResponse?.data || {};

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const renderRatingDistribution = () => {
    const total = parseInt(stats.total_reviews) || 0;
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count =
            parseInt(
              stats[
                `${["", "one", "two", "three", "four", "five"][rating]}_star`
              ]
            ) || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={rating} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 w-8">{rating}</span>
              <Star size={14} className="text-yellow-400 fill-current" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Reviews & Feedback
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your reviews and see feedback from others
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Review Summary
              </h3>

              {stats.total_reviews > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {parseFloat(stats.average_rating || 0).toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      {renderStars(Math.round(stats.average_rating || 0))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {stats.total_reviews} reviews
                    </p>
                  </div>

                  {renderRatingDistribution()}
                </>
              ) : (
                <div className="text-center py-4">
                  <Star size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No reviews yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("received")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "received"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Received ({receivedReviews.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("given")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "given"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Given ({givenReviews.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Received Reviews */}
                {activeTab === "received" && (
                  <div>
                    {loadingReceived ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse border-b border-gray-200 pb-4"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : receivedReviews.length > 0 ? (
                      <div className="space-y-6">
                        {receivedReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b border-gray-200 pb-6 last:border-b-0"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {review.reviewer_avatar ? (
                                  <img
                                    src={review.reviewer_avatar}
                                    alt={review.reviewer_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User size={20} className="text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {review.reviewer_name}
                                  </h4>
                                  <div className="flex items-center">
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                {review.ad_title && (
                                  <p className="text-sm text-green-600 mb-2">
                                    Review for: {review.ad_title}
                                  </p>
                                )}
                                {review.comment && (
                                  <p className="text-gray-700 mb-2">
                                    {review.comment}
                                  </p>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar size={14} className="mr-1" />
                                  <span>
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star
                          size={48}
                          className="mx-auto text-gray-400 mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No reviews received
                        </h3>
                        <p className="text-gray-600">
                          Reviews from buyers will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Given Reviews */}
                {activeTab === "given" && (
                  <div>
                    {loadingGiven ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse border-b border-gray-200 pb-4"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : givenReviews.length > 0 ? (
                      <div className="space-y-6">
                        {givenReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b border-gray-200 pb-6 last:border-b-0"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {review.reviewed_user_avatar ? (
                                  <img
                                    src={review.reviewed_user_avatar}
                                    alt={review.reviewed_user_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User size={20} className="text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {review.reviewed_user_name}
                                  </h4>
                                  <div className="flex items-center">
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                {review.ad_title && (
                                  <p className="text-sm text-green-600 mb-2">
                                    Review for: {review.ad_title}
                                  </p>
                                )}
                                {review.comment && (
                                  <p className="text-gray-700 mb-2">
                                    {review.comment}
                                  </p>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar size={14} className="mr-1" />
                                  <span>
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle
                          size={48}
                          className="mx-auto text-gray-400 mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No reviews given
                        </h3>
                        <p className="text-gray-600">
                          Reviews you give to sellers will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
