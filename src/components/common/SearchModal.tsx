import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { X, Search, TrendingUp, Clock } from "lucide-react";
import { setSearchModalOpen } from "../../redux/slices/uiSlice";
import { useGetCategoriesQuery } from "../../redux/api/categoriesApi";

const SearchModal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { searchModalOpen } = useSelector((state) => state.ui);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches] = useState([
    "iPhone 13",
    "Toyota Camry",
    "Laptop",
    "House for rent Lagos",
  ]);

  const { data: categories } = useGetCategoriesQuery();

  const popularSearches = [
    "Cars in Lagos",
    "iPhone for sale",
    "House for rent",
    "Jobs in Abuja",
    "Laptop deals",
    "Fashion items",
  ];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        dispatch(setSearchModalOpen(false));
      }
    };

    if (searchModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [searchModalOpen, dispatch]);

  const handleSearch = (term) => {
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term)}`);
      dispatch(setSearchModalOpen(false));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => dispatch(setSearchModalOpen(false))}
        />

        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Search Jiji</h2>
            <button
              onClick={() => dispatch(setSearchModalOpen(false))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>
            </form>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Clock size={16} className="mr-2" />
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp size={16} className="mr-2" />
                Popular Searches
              </h3>
              <div className="space-y-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Browse Categories
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categories?.data?.slice(0, 8).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      navigate(`/search?category_id=${category.id}`);
                      dispatch(setSearchModalOpen(false));
                    }}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
