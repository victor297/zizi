import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  User,
  Heart,
  MessageCircle,
  Plus,
  Menu,
  X,
  LogOut,
  Settings,
  MapPin,
  Star,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";
import { setSidebarOpen } from "../../redux/slices/uiSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <span className="font-bold text-xl">J</span>
              </div>
              <span className="text-2xl font-bold text-green-600">Jiji</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search */}
            <button className="md:hidden p-2 text-gray-600 hover:text-green-600">
              <Search size={24} />
            </button>

            {/* Location */}
            <div className="hidden lg:flex items-center space-x-1 text-gray-600">
              <MapPin size={16} />
              <span className="text-sm">Nigeria</span>
            </div>

            {isAuthenticated ? (
              <>
                {/* Post Ad Button */}
                <Link
                  to="/create-ad"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Post Ad</span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-green-600" />
                    </div>
                    <span className="hidden md:inline text-gray-700">
                      {user?.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        <span>My Dashboard</span>
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart size={16} />
                        <span>Favorites</span>
                      </Link>
                      <Link
                        to="/saved-searches"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Search size={16} />
                        <span>Saved Searches</span>
                      </Link>
                      <Link
                        to="/reviews"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Star size={16} />
                        <span>Reviews</span>
                      </Link>
                      <Link
                        to="/chat"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageCircle size={16} />
                        <span>Messages</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full text-left"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <Search size={20} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
