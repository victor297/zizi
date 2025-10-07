import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGetAdsQuery } from "../redux/api/adsApi";
import { useGetCategoriesQuery } from "../redux/api/categoriesApi";
import { useSaveSearchMutation } from "../redux/api/savedSearchesApi";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Clock,
  Heart,
  Star,
  Grid2x2 as Grid,
  List,
  Bookmark,
  X,
} from "lucide-react";
import { addNotification } from "../redux/slices/uiSlice";

const Search = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    category_id: searchParams.get("category_id") || "",
    location: searchParams.get("location") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    condition: searchParams.get("condition") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Clean filters before sending to API - remove empty values
  const cleanFilters = (filters) => {
    const cleaned = { ...filters };

    // Remove empty string values
    Object.keys(cleaned).forEach((key) => {
      if (
        cleaned[key] === "" ||
        cleaned[key] === null ||
        cleaned[key] === undefined
      ) {
        delete cleaned[key];
      }
    });

    return cleaned;
  };

  const {
    data: adsResponse,
    isLoading,
    error,
  } = useGetAdsQuery(cleanFilters(filters));
  const { data: categories } = useGetCategoriesQuery();
  const [saveSearch] = useSaveSearchMutation();

  // Extract data from the response
  const adsData = adsResponse?.data || { ads: [], total: 0, totalPages: 0 };
  const categoriesData = categories?.data || [];

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters({
      q: "",
      category_id: "",
      location: "",
      min_price: "",
      max_price: "",
      condition: "",
      sort_by: "newest",
      page: 1,
    });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      dispatch(
        addNotification({
          type: "error",
          message: "Please enter a name for your search",
        })
      );
      return;
    }

    try {
      await saveSearch({
        name: searchName,
        search_params: cleanFilters(filters), // Use cleaned filters here too
        notification_enabled: false,
      }).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: "Search saved successfully!",
        })
      );

      setShowSaveModal(false);
      setSearchName("");
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          message: "Failed to save search",
        })
      );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Search Error
          </h2>
          <p className="text-gray-600">
            Failed to load search results. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={20} />
                <span>Filters</span>
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bookmark size={20} />
                <span>Save Search</span>
              </button>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 ${
                    viewMode === "grid"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 ${
                    viewMode === "list"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category_id}
                    onChange={(e) =>
                      handleFilterChange("category_id", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Categories</option>
                    {categoriesData.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={filters.location}
                    onChange={(e) =>
                      handleFilterChange("location", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price}
                      onChange={(e) =>
                        handleFilterChange("min_price", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price}
                      onChange={(e) =>
                        handleFilterChange("max_price", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={filters.condition}
                    onChange={(e) =>
                      handleFilterChange("condition", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Any Condition</option>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear all filters
                </button>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sort by:
                  </label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) =>
                      handleFilterChange("sort_by", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="featured">Featured First</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {filters.q
                    ? `Search results for "${filters.q}"`
                    : "All Listings"}
                </h1>
                {adsData && (
                  <p className="text-gray-600 mt-1">
                    {adsData.total} results found
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
            )}

            {/* Results Grid/List */}
            {adsData.ads && (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {adsData.ads.map((ad) => (
                    <Link
                      key={ad.id}
                      to={`/ads/${ad.id}`}
                      className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                        viewMode === "list" ? "flex" : ""
                      }`}
                    >
                      <div
                        className={`relative ${
                          viewMode === "list" ? "w-48 flex-shrink-0" : ""
                        }`}
                      >
                        <img
                          src={
                            ad.images?.[0]?.url ||
                            ad.images?.[0] ||
                            "https://images.pexels.com/photos-3184287/pexels-photo-3184287.jpeg"
                          }
                          alt={ad.title}
                          className={`object-cover ${
                            viewMode === "list" ? "w-full h-32" : "w-full h-48"
                          }`}
                        />
                        {ad.is_featured && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                              <Star size={12} fill="currentColor" />
                              <span>Featured</span>
                            </span>
                          </div>
                        )}
                        {ad.is_urgent && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                              Urgent
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1">
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
                        <div className="flex items-center justify-between text-gray-500 text-sm">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span>
                              {new Date(ad.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Heart size={16} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {adsData.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>

                    {[...Array(Math.min(5, adsData.totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            filters.page === page
                              ? "bg-green-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= adsData.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* No Results */}
                {adsData.ads.length === 0 && (
                  <div className="text-center py-12">
                    <SearchIcon
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowSaveModal(false)}
            />

            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Save Search
                </h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Name
                  </label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="e.g., iPhone in Lagos"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Search Criteria
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {filters.q && <p>Query: "{filters.q}"</p>}
                    {filters.category_id && <p>Category: Selected</p>}
                    {filters.location && <p>Location: {filters.location}</p>}
                    {(filters.min_price || filters.max_price) && (
                      <p>
                        Price: ₦{filters.min_price || 0} - ₦
                        {filters.max_price || "∞"}
                      </p>
                    )}
                    {filters.condition && <p>Condition: {filters.condition}</p>}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSearch}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
