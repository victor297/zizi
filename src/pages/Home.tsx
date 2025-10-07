import React from "react";
import { Link } from "react-router-dom";
import { useGetFeaturedAdsQuery, useGetAdsQuery } from "../redux/api/adsApi";
import { useGetCategoriesQuery } from "../redux/api/categoriesApi";
import {
  Car,
  Home,
  Smartphone,
  Laptop,
  Briefcase,
  Shirt,
  Star,
  MapPin,
  Clock,
  TrendingUp,
  Shield,
  Users,
} from "lucide-react";

const categoryIcons = {
  cars: Car,
  properties: Home,
  phones: Smartphone,
  electronics: Laptop,
  jobs: Briefcase,
  fashion: Shirt,
};

const HomePage = () => {
  const { data: featuredAdsResponse, isLoading: loadingFeatured } =
    useGetFeaturedAdsQuery();
  const { data: recentAdsResponse, isLoading: loadingRecent } = useGetAdsQuery({
    limit: 8,
  });
  const { data: categories, isLoading: loadingCategories } =
    useGetCategoriesQuery();

  // Extract data from responses
  const featuredAds = featuredAdsResponse?.data;
  const recentAds = recentAdsResponse?.data;

  const features = [
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Verified listings and secure messaging system",
    },
    {
      icon: Users,
      title: "Large Community",
      description: "Millions of users buying and selling daily",
    },
    {
      icon: TrendingUp,
      title: "Best Prices",
      description: "Competitive prices from trusted sellers",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-white to-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Buy & Sell Anything
              <span className="block text-green-600">In Nigeria</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              From cars and phones to houses and jobs. Find everything you need
              on Nigeria's largest marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                to="/create-ad"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Post an Ad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-gray-600">
              Browse by category to find exactly what you're looking for
            </p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-6 shadow-sm animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories?.data?.slice(0, 6).map((category) => {
                const IconComponent = categoryIcons[category.slug] || Briefcase;
                return (
                  <Link
                    key={category.id}
                    to={`/search?category=${category.slug}`}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <IconComponent size={24} className="text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.ad_count} ads
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Ads Section */}
      {featuredAds && featuredAds.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Featured Listings
                </h2>
                <p className="text-gray-600">
                  Premium listings from verified sellers
                </p>
              </div>
              <Link
                to="/search?featured=true"
                className="text-green-600 font-semibold hover:text-green-700"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAds.slice(0, 4).map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        ad.images?.[0] ||
                        "https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg"
                      }
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <Star size={12} fill="currentColor" />
                        <span>Featured</span>
                      </span>
                    </div>
                    {ad.is_urgent && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {ad.title}
                    </h3>
                    <p className="text-green-600 font-bold text-lg mb-2">
                      ₦{ad.price?.toLocaleString()}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{ad.location}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {new Date(ad.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Ads Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Latest Ads
              </h2>
              <p className="text-gray-600">Fresh listings from our community</p>
            </div>
            <Link
              to="/search"
              className="text-green-600 font-semibold hover:text-green-700"
            >
              View All →
            </Link>
          </div>

          {loadingRecent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentAds?.ads?.slice(0, 8).map((ad) => (
                <Link
                  key={ad.id}
                  to={`/ads/${ad.id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        ad.images?.[0] ||
                        "https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg"
                      }
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                    {ad.is_urgent && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {ad.title}
                    </h3>
                    <p className="text-green-600 font-bold text-lg mb-2">
                      ₦{ad.price?.toLocaleString()}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{ad.location}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {new Date(ad.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Jiji?
            </h2>
            <p className="text-gray-600">
              The best marketplace experience in Nigeria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-green-100 mb-8 text-lg max-w-2xl mx-auto">
            Join millions of Nigerians buying and selling on Jiji. It's fast,
            safe, and completely free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/create-ad"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Post Your First Ad
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
