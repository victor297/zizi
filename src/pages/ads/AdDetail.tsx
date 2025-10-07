import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  Flag, 
  Phone, 
  MessageCircle,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useGetAdQuery } from '../../redux/api/adsApi';
import { useCreateConversationMutation } from '../../redux/api/chatApi';

const AdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const { data: adData, isLoading, error } = useGetAdQuery(id);
  const [createConversation] = useCreateConversationMutation();

  // Extract data from the response
  const ad = adData?.data?.ad;
  const similarAds = adData?.data?.similarAds;

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const conversation = await createConversation({
        recipient_id: ad.user_id,
        ad_id: ad.id
      }).unwrap();
      
      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: adData.ad.title,
          text: adData.ad.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (ad.images && ad.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === ad.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (ad.images && ad.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? ad.images.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ad Not Found</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const images = ad.images || [];
  const isOwner = user?.id === ad.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {images.length > 0 ? (
                <div className="relative">
                  <img
                    src={images[currentImageIndex]}
                    alt={ad.title}
                    className="w-full h-96 object-cover"
                  />
                  
                  {/* Featured/Urgent Badges */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    {ad.is_featured && (
                      <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full flex items-center space-x-1">
                        <Star size={14} fill="currentColor" />
                        <span>Featured</span>
                      </span>
                    )}
                    {ad.is_urgent && (
                      <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No images available</span>
                </div>
              )}

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-green-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${ad.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ad Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
                  <p className="text-4xl font-bold text-green-600 mb-4">₦{ad.price?.toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Heart size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                    <Flag size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  <span>{ad.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock size={16} className="mr-2" />
                  <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Eye size={16} className="mr-2" />
                  <span>{ad.views_count || 0} views</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="capitalize">{ad.condition}</span>
                </div>
              </div>

              {/* Job-specific details */}
              {ad.job_type && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Briefcase size={16} className="mr-2 text-gray-600" />
                      <span className="text-sm text-gray-600">Job Type:</span>
                      <span className="ml-2 capitalize">{ad.job_type}</span>
                    </div>
                    {ad.salary_range && (
                      <div className="flex items-center">
                        <DollarSign size={16} className="mr-2 text-gray-600" />
                        <span className="text-sm text-gray-600">Salary:</span>
                        <span className="ml-2">{ad.salary_range}</span>
                      </div>
                    )}
                    {ad.experience_level && (
                      <div className="flex items-center">
                        <User size={16} className="mr-2 text-gray-600" />
                        <span className="text-sm text-gray-600">Experience:</span>
                        <span className="ml-2 capitalize">{ad.experience_level}</span>
                      </div>
                    )}
                    {ad.deadline && (
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-600" />
                        <span className="text-sm text-gray-600">Deadline:</span>
                        <span className="ml-2">{new Date(ad.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {ad.company_name && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">Company:</span>
                      <span className="ml-2 font-medium">{ad.company_name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <User size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{ad.user_name}</h3>
                  <p className="text-sm text-gray-600">Member since {new Date(ad.user_joined).getFullYear()}</p>
                </div>
              </div>

              {!isOwner && (
                <div className="space-y-3">
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle size={20} />
                    <span>Chat with Seller</span>
                  </button>
                  
                  {ad.contact_phone && (
                    <button
                      onClick={() => setShowContactInfo(!showContactInfo)}
                      className="w-full border border-green-600 text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Phone size={20} />
                      <span>{showContactInfo ? ad.contact_phone : 'Show Phone'}</span>
                    </button>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="space-y-3">
                  <Link
                    to={`/ads/${ad.id}/edit`}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block"
                  >
                    Edit Ad
                  </Link>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Views: {ad.views_count || 0}</p>
                    <p>Favorites: {ad.favorites_count || 0}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Safety Tips</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Meet in a public place</li>
                <li>• Check the item before payment</li>
                <li>• Don't pay in advance</li>
                <li>• Report suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Similar Ads */}
        {similarAds && similarAds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Ads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarAds.map((similarAd) => (
                <Link
                  key={similarAd.id}
                  to={`/ads/${similarAd.id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <img
                    src={similarAd.images?.[0]?.url || 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg'}
                    alt={similarAd.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{similarAd.title}</h3>
                    <p className="text-green-600 font-bold text-lg mb-2">₦{similarAd.price?.toLocaleString()}</p>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin size={14} className="mr-1" />
                      <span>{similarAd.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDetail;