import React, { useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  Users,
  FileText,
  Folder,
  BarChart3,
  Settings,
  Shield,
  TrendingUp,
  Eye,
  DollarSign,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { useGetStatsQuery } from "../../redux/api/adminApi";
import UserManagement from "./UserManagement";
import AdManagement from "./AdManagement";
import CategoryManagement from "./CategoryManagement";
import Analytics from "./Analytics";
import SubscriptionPlans from "./SubscriptionPlans";

const AdminDashboard = () => {
  const location = useLocation();

  const { data: statsResponse, isLoading } = useGetStatsQuery();
  const stats = statsResponse?.data || {};

  const navigation = [
    {
      name: "Overview",
      href: "/admin",
      icon: BarChart3,
      current:
        location.pathname === "/admin" || location.pathname === "/admin/",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: location.pathname === "/admin/users",
    },
    {
      name: "Ads",
      href: "/admin/ads",
      icon: FileText,
      current: location.pathname === "/admin/ads",
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Folder,
      current: location.pathname === "/admin/categories",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: TrendingUp,
      current: location.pathname === "/admin/analytics",
    },
    {
      name: "Subscriptions",
      href: "/admin/subscription-plans",
      icon: CreditCard,
      current: location.pathname === "/admin/subscription-plans",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: location.pathname === "/admin/settings",
    },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = "green" }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <Shield size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </div>
          </div>

          <nav className="mt-6">
            <div className="px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${
                      item.current
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        item.current
                          ? "text-green-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <div className="p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                      Dashboard Overview
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Monitor your platform's performance and activity
                    </p>
                  </div>

                  {/* Stats Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="ml-4 flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard
                        title="Total Users"
                        value={(stats.users?.total_users || 0).toLocaleString()}
                        change={12}
                        icon={Users}
                        color="blue"
                      />
                      <StatCard
                        title="Active Ads"
                        value={(stats.ads?.active_ads || 0).toLocaleString()}
                        change={8}
                        icon={FileText}
                        color="green"
                      />
                      <StatCard
                        title="Pending Ads"
                        value={(stats.ads?.pending_ads || 0).toLocaleString()}
                        change={-5}
                        icon={AlertTriangle}
                        color="red"
                      />
                      <StatCard
                        title="Categories"
                        value={(
                          stats.categories?.total_categories || 0
                        ).toLocaleString()}
                        change={2}
                        icon={Folder}
                        color="purple"
                      />
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link
                      to="/admin/users"
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="text-blue-600" size={24} />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            Manage Users
                          </h3>
                          <p className="text-sm text-gray-600">
                            View and moderate users
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/ads"
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="text-green-600" size={24} />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            Manage Ads
                          </h3>
                          <p className="text-sm text-gray-600">
                            Moderate advertisements
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/categories"
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Folder className="text-purple-600" size={24} />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            Categories
                          </h3>
                          <p className="text-sm text-gray-600">
                            Manage categories
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/subscription-plans"
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <CreditCard className="text-yellow-600" size={24} />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            Subscriptions
                          </h3>
                          <p className="text-sm text-gray-600">Manage plans</p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          action: "New user registered",
                          user: "John Doe",
                          time: "2 minutes ago",
                        },
                        {
                          action: "Ad approved",
                          user: "Jane Smith",
                          time: "5 minutes ago",
                        },
                        {
                          action: "Payment received",
                          user: "Mike Johnson",
                          time: "10 minutes ago",
                        },
                        {
                          action: "Ad reported",
                          user: "Sarah Wilson",
                          time: "15 minutes ago",
                        },
                        {
                          action: "Category created",
                          user: "Admin",
                          time: "1 hour ago",
                        },
                      ].map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            <p className="text-sm text-gray-600">
                              by {activity.user}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {activity.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              }
            />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/ads" element={<AdManagement />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/subscription-plans" element={<SubscriptionPlans />} />
            <Route
              path="/settings"
              element={
                <div className="p-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Settings
                  </h1>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-gray-600">
                      Settings panel will be implemented here.
                    </p>
                  </div>
                </div>
              }
            />{" "}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
