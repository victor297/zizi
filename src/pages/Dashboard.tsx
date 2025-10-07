import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Plus,
  Eye,
  CreditCard as Edit,
  Trash2,
  Heart,
  MessageCircle,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useGetAdsQuery } from "../redux/api/adsApi";
import PaymentModal from "../components/ads/PaymentModal";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("ads");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAdForPayment, setSelectedAdForPayment] = useState(null);

  const { data: myAdsResponse, isLoading } = useGetAdsQuery({
    user_id: user?.id,
    limit: 20,
  });

  // Extract data from the response
  const myAdsData = myAdsResponse?.data;

  const stats = {
    totalAds: myAdsData?.total || 0,
    activeAds:
      myAdsData?.ads?.filter((ad) => ad.status === "active").length || 0,
    totalViews:
      myAdsData?.ads?.reduce((sum, ad) => sum + (ad.views_count || 0), 0) || 0,
    totalFavorites:
      myAdsData?.ads?.reduce((sum, ad) => sum + (ad.favorites_count || 0), 0) ||
      0,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "sold":
        return "text-blue-600 bg-blue-100";
      case "expired":
        return "text-gray-600 bg-gray-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your listings and account
            </p>
          </div>
          <Link
            to="/create-ad"
            className="mt-4 md:mt-0 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Post New Ad</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAds}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalViews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalFavorites}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Ads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeAds}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("ads")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "ads"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Ads ({stats.totalAds})
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "favorites"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Favorites
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "messages"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Messages
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* My Ads Tab */}
            {activeTab === "ads" && (
              <div>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse flex space-x-4 p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myAdsData?.ads?.length > 0 ? (
                  <div className="space-y-4">
                    {myAdsData.ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={
                            ad.images?.[0] ||
                            "https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg"
                          }
                          alt={ad.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {ad.title}
                              </h3>
                              <p className="text-green-600 font-bold text-lg mb-2">
                                ₦{ad.price?.toLocaleString()}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  <span>{ad.location}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  <span>
                                    {new Date(
                                      ad.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Eye size={14} className="mr-1" />
                                  <span>{ad.views_count || 0} views</span>
                                </div>
                                <div className="flex items-center">
                                  <Heart size={14} className="mr-1" />
                                  <span>
                                    {ad.favorites_count || 0} favorites
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                                  ad.status
                                )}`}
                              >
                                {ad.status}
                              </span>

                              <div className="flex items-center space-x-1">
                                <Link
                                  to={`/ads/${ad.id}`}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Ad"
                                >
                                  <Eye size={16} />
                                </Link>
                                <Link
                                  to={`/ads/${ad.id}/edit`}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Edit Ad"
                                >
                                  <Edit size={16} />
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedAdForPayment(ad);
                                    setShowPaymentModal(true);
                                  }}
                                  className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                  title="Promote Ad"
                                >
                                  <Star size={16} />
                                </button>
                                <button
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Ad"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No ads yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start selling by posting your first ad
                    </p>
                    <Link
                      to="/create-ad"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus size={20} />
                      <span>Post Your First Ad</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No favorites yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Save ads you're interested in to see them here
                </p>
                <Link
                  to="/search"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Ads
                </Link>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="text-center py-12">
                <MessageCircle
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Your conversations with buyers and sellers will appear here
                </p>
                <Link
                  to="/chat"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Messages
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        adId={selectedAdForPayment?.id}
        adTitle={selectedAdForPayment?.title}
      />
    </div>
  );
};

export default Dashboard;
