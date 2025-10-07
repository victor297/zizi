import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import NotificationToast from "./components/common/NotificationToast";
import SearchModal from "./components/common/SearchModal";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdDetail from "./pages/ads/AdDetail";
import CreateAd from "./pages/ads/CreateAd";
import EditAd from "./pages/ads/EditAd";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import PaymentCallback from "./pages/PaymentCallback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdManagement from "./pages/admin/AdManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import Analytics from "./pages/admin/Analytics";
import SubscriptionPlans from "./pages/admin/SubscriptionPlans";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import SavedSearches from "./pages/SavedSearches";
import Favorites from "./pages/Favorites";
import Reviews from "./pages/Reviews";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <NotificationToast />
          <SearchModal />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/search" element={<Search />} />
              <Route path="/ads/:id" element={<AdDetail />} />
              <Route
                path="/ads/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditAd />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-searches"
                element={
                  <ProtectedRoute>
                    <SavedSearches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute>
                    <Reviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-ad"
                element={
                  <ProtectedRoute>
                    <CreateAd />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              {/* <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/ads" element={<AdManagement />} />
                      <Route
                        path="/categories"
                        element={<CategoryManagement />}
                      />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route
                        path="/subscription-plans"
                        element={<SubscriptionPlans />}
                      />
                    </Routes>
                  </AdminRoute>
                }
                   
              /> */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
