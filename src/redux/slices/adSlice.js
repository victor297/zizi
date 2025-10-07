import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ads: [],
  featuredAds: [],
  currentAd: null,
  filters: {
    category: '',
    subcategory: '',
    location: '',
    priceRange: { min: 0, max: 0 },
    sortBy: 'newest',
    searchTerm: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

const adSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    setAds: (state, action) => {
      state.ads = action.payload;
    },
    setFeaturedAds: (state, action) => {
      state.featuredAds = action.payload;
    },
    setCurrentAd: (state, action) => {
      state.currentAd = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addToFavorites: (state, action) => {
      const adId = action.payload;
      const ad = state.ads.find(ad => ad.id === adId);
      if (ad) ad.isFavorite = true;
    },
    removeFromFavorites: (state, action) => {
      const adId = action.payload;
      const ad = state.ads.find(ad => ad.id === adId);
      if (ad) ad.isFavorite = false;
    },
  },
});

export const {
  setAds,
  setFeaturedAds,
  setCurrentAd,
  updateFilters,
  resetFilters,
  setPagination,
  addToFavorites,
  removeFromFavorites,
} = adSlice.actions;

export default adSlice.reducer;