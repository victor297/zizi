import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Calendar, 
  Star, 
  MessageCircle, 
  Flag,
  Eye,
  Heart,
  Clock
} from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('ads');

  // Mock user data - replace with actual API call
  const user = {
    id: id,
    name: 'John Doe',
    avatar_url: null,
    location: 'Lagos, Nigeria',
    created_at: '2023-01-15',
    active_ads: 12,
    sold_ads: 8,
    average_rating: 4.5,
    review_count: 23,
    response_rate: 95,
    last_seen: '2024-01-15'
  };

  // Mock ads data - replace with actual API call
  const userAds = [
    {
      id: 1,
      title: 'iPhone 13 Pro Max - 256GB',
      price: 650000,
      location: 'Lagos, Nigeria',
      created_at: '2024-01-10',
      images: ['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg'],
      views_count: 45,
      favorites_count: 8,
      status: 'active'
    },
    {
      id: 2,
      title: 'MacBook Pro 2021 - M1 Chip',
      price: 1800000,
      location: 'Lagos, Nigeria',
      created_at: '2024-01-08',
      images: ['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg'],
      views_count: 67,
      favorites_count: 12,
      status: 'active'
    }
  ];

  const handleContactSeller = () => {
    // Navigate to chat or show contact modal
    console.log('Contact seller');
  };

  const handleReportUser = () => {
    // Show report modal
    console.log('Report user');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-green-600" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <div className="flex items-center justify-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>Member since {new Date(user.created_at).getFullYear()}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{user.active_ads}</p>
                  <p className="text-sm text-gray-600">Active Ads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{user.sold_ads}</p>
                  <p className="text-sm text-gray-600">Sold</p>
                </div>
              </div>

              {/* Rating */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < Math.floor(user.average_rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-lg font-semibold text-gray-900">
                    {user.average_rating}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {user.review_count} reviews • {user.response_rate}% response rate
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={20} />
                  <span>Contact Seller</span>
                </button>
                <button
                  onClick={handleReportUser}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Flag size={20} />
                  <span>Report User</span>
                </button>
              </div>

              {/* Last Seen */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Last seen {new Date(user.last_seen).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Safety Tips</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Meet in a public place</li>
                <li>• Check the item before payment</li>
                <li>• Don't pay in advance</li>
                <li>• Report suspicious activity</li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('ads')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'ads'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Ads ({user.active_ads})
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews ({user.review_count})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Ads Tab */}
                {activeTab === 'ads' && (
                  <div>
                    {userAds.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userAds.map((ad) => (
                          <Link
                            key={ad.id}
                            to={`/ads/${ad.id}`}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {ad.title}
                              </h3>
                              <p className="text-green-600 font-bold text-lg mb-2">
                                ₦{ad.price.toLocaleString()}
                              </p>
                              <div className="flex items-center text-gray-500 text-sm mb-2">
                                <MapPin size={14} className="mr-1" />
                                <span>{ad.location}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-500 text-sm">
                                <div className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center">
                                    <Eye size={14} className="mr-1" />
                                    <span>{ad.views_count}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Heart size={14} className="mr-1" />
                                    <span>{ad.favorites_count}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <User size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No ads yet</h3>
                        <p className="text-gray-600">This user hasn't posted any ads yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    {user.review_count > 0 ? (
                      <div className="space-y-6">
                        {/* Mock reviews */}
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={20} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">Anonymous User</h4>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, j) => (
                                      <Star
                                        key={j}
                                        size={16}
                                        className={`${
                                          j < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">
                                  Great seller! Item was exactly as described and delivery was prompt.
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600">This user hasn't received any reviews yet.</p>
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

export default Profile;