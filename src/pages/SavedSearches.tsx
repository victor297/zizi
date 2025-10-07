import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Bell, BellOff, Plus, X } from 'lucide-react';
import { useGetSavedSearchesQuery, useDeleteSavedSearchMutation, useDeleteAllSavedSearchesMutation, useUpdateSavedSearchMutation } from '../redux/api/savedSearchesApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../redux/slices/uiSlice';

const SavedSearches = () => {
  const dispatch = useDispatch();
  const { data: savedSearchesData, isLoading } = useGetSavedSearchesQuery();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();
  const [deleteAllSavedSearches] = useDeleteAllSavedSearchesMutation();
  const [updateSavedSearch] = useUpdateSavedSearchMutation();

  const savedSearches = savedSearchesData?.data || [];

  const handleDelete = async (id) => {
    try {
      await deleteSavedSearch(id).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Saved search deleted successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete saved search'
      }));
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all saved searches?')) {
      try {
        await deleteAllSavedSearches().unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'All saved searches deleted successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to delete saved searches'
        }));
      }
    }
  };

  const toggleNotifications = async (id, currentStatus) => {
    try {
      await updateSavedSearch({
        id,
        notification_enabled: !currentStatus
      }).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Notifications ${!currentStatus ? 'enabled' : 'disabled'} for this search`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update notification settings'
      }));
    }
  };

  const buildSearchUrl = (searchParams) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    return `/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600 mt-1">Manage your saved searches and get notifications for new matches</p>
          </div>
          {savedSearches.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : savedSearches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSearches.map((search) => (
              <div key={search.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{search.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleNotifications(search.id, search.notification_enabled)}
                      className={`p-2 rounded-lg transition-colors ${
                        search.notification_enabled
                          ? 'text-green-600 bg-green-100 hover:bg-green-200'
                          : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={search.notification_enabled ? 'Disable notifications' : 'Enable notifications'}
                    >
                      {search.notification_enabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete search"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {search.search_params.q && (
                    <div className="text-sm">
                      <span className="text-gray-600">Query:</span>
                      <span className="ml-2 font-medium">{search.search_params.q}</span>
                    </div>
                  )}
                  {search.search_params.category_id && (
                    <div className="text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-medium">Selected</span>
                    </div>
                  )}
                  {search.search_params.location && (
                    <div className="text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{search.search_params.location}</span>
                    </div>
                  )}
                  {(search.search_params.min_price || search.search_params.max_price) && (
                    <div className="text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="ml-2 font-medium">
                        ₦{search.search_params.min_price || 0} - ₦{search.search_params.max_price || '∞'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Saved {new Date(search.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    to={buildSearchUrl(search.search_params)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Search size={14} />
                    <span>Search</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h3>
            <p className="text-gray-600 mb-4">Save your searches to quickly find what you're looking for</p>
            <Link
              to="/search"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Start Searching</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSearches;