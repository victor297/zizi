import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useGetAnalyticsQuery } from '../../redux/api/adminApi';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const { data: analyticsResponse, isLoading } = useGetAnalyticsQuery(timeframe);

  const analytics = analyticsResponse?.data || {};

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = 'green' }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from previous period
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform performance and insights</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {timeframeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
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
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="New Users"
              value="1,234"
              change={12}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="New Ads"
              value="2,567"
              change={8}
              icon={FileText}
              color="green"
            />
            <StatCard
              title="Revenue"
              value="₦450,000"
              change={15}
              icon={DollarSign}
              color="yellow"
            />
            <StatCard
              title="Active Users"
              value="8,932"
              change={5}
              icon={Activity}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
                <BarChart3 className="text-gray-400" size={20} />
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analytics.userTrends?.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(trend.count / Math.max(...(analytics.userTrends?.map(t => t.count) || [1]))) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(trend.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )) || (
                  <div className="w-full h-64 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
                <PieChart className="text-gray-400" size={20} />
              </div>
              <div className="space-y-4">
                {analytics.categoryStats?.map((category, index) => {
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                  const color = colors[index % colors.length];
                  const total = analytics.categoryStats?.reduce((sum, cat) => sum + cat.ad_count, 0) || 1;
                  const percentage = (category.ad_count / total) * 100;
                  
                  return (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${color} rounded-full mr-3`}></div>
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{category.ad_count}</span>
                        <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center text-gray-500 py-8">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.userTrends?.reduce((sum, trend) => sum + trend.count, 0) || 0}
                </div>
                <p className="text-sm text-gray-600">Total New Users</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.adTrends?.reduce((sum, trend) => sum + trend.count, 0) || 0}
                </div>
                <p className="text-sm text-gray-600">Total New Ads</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.categoryStats?.length || 0}
                </div>
                <p className="text-sm text-gray-600">Active Categories</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;