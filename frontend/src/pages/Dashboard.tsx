import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  FileText,
  TrendingUp,
  Activity,
  Sitemap,
  Tag,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMinistries, usePositions, useAttributes, useUsers } from '../hooks/useApi';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  link?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = React.memo(({
  title,
  value,
  icon: Icon,
  description,
  link,
  trend,
}) => {
  const content = (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="bg-qatar-maroon rounded-md p-3">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <TrendingUp
                      className={`self-center flex-shrink-0 h-4 w-4 ${
                        trend.isPositive ? 'text-green-500' : 'text-red-500 transform rotate-180'
                      }`}
                    />
                    <span className="sr-only">
                      {trend.isPositive ? 'Increased' : 'Decreased'} by
                    </span>
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
          {link && (
            <div className="flex-shrink-0">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
});

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = React.memo(({
  title,
  description,
  icon: Icon,
  link,
  color,
}) => (
  <Link
    to={link}
    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-qatar-maroon rounded-lg shadow hover:shadow-md transition-shadow duration-200"
  >
    <div>
      <span className={`rounded-lg inline-flex p-3 ${color} ring-4 ring-white`}>
        <Icon className="h-6 w-6 text-white" />
      </span>
    </div>
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 group-hover:text-qatar-maroon">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
    <span className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
      <ChevronRight className="h-6 w-6" />
    </span>
  </Link>
));

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: ministries, isLoading: ministriesLoading } = useMinistries();
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: attributes, isLoading: attributesLoading } = useAttributes();
  const { data: users, isLoading: usersLoading } = useUsers();

  const isLoading = ministriesLoading || positionsLoading || attributesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = useMemo(() => [
    {
      title: 'Total Ministries',
      value: ministries?.length || 0,
      icon: Building2,
      description: 'Government ministries in system',
      link: '/organization-chart',
      trend: { value: 5, isPositive: true },
    },
    {
      title: 'Active Positions',
      value: positions?.data?.filter(p => p.status === 'active').length || 0,
      icon: Users,
      description: 'Currently active positions',
      link: '/positions',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'System Attributes',
      value: attributes?.length || 0,
      icon: Tag,
      description: 'Available position attributes',
      link: '/attributes',
    },
    {
      title: 'System Users',
      value: users?.data?.length || 0,
      icon: Activity,
      description: 'Total system users',
      link: user?.role === 'super_admin' ? '/users' : undefined,
    },
  ], [ministries, positions, attributes, users, user?.role]);

  const quickActions = useMemo(() => [
    {
      title: 'View Organization Chart',
      description: 'Visualize the complete organizational hierarchy',
      icon: Sitemap,
      link: '/organization-chart',
      color: 'bg-qatar-maroon',
    },
    {
      title: 'Manage Positions',
      description: 'Add, edit, or remove organizational positions',
      icon: Users,
      link: '/positions',
      color: 'bg-blue-600',
    },
    {
      title: 'Configure Attributes',
      description: 'Manage position attributes and classifications',
      icon: Tag,
      link: '/attributes',
      color: 'bg-green-600',
    },
    {
      title: 'Generate Reports',
      description: 'Create organizational structure reports',
      icon: FileText,
      link: '#',
      color: 'bg-purple-600',
    },
  ], []);

  const recentActivities = useMemo(() => [
    {
      id: 1,
      type: 'position_created',
      message: 'New position "Director of IT" was created',
      timestamp: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'attribute_updated',
      message: 'Security clearance attribute was updated',
      timestamp: '4 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'user_login',
      message: 'Ministry admin logged in from new location',
      timestamp: '6 hours ago',
      status: 'warning',
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-qatar-maroon to-qatar-maroon/80 rounded-lg shadow">
        <div className="px-6 py-8">
          <div className="flex items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.firstName} {user?.lastName}
              </h1>
              <p className="mt-1 text-qatar-maroon/20">
                Qatar Government Organization Chart System Dashboard
              </p>
              <p className="mt-2 text-sm text-white/80">
                Role: {user?.role?.replace('_', ' ').toUpperCase()} • Last login: Today
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="bg-white/10 rounded-full p-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <DashboardCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Common tasks and frequently used features
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {quickActions.slice(0, 4).map(action => (
                  <QuickAction key={action.title} {...action} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <p className="mt-1 text-sm text-gray-500">Latest system activities</p>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            {activity.status === 'success' && (
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            )}
                            {activity.status === 'info' && (
                              <AlertCircle className="h-8 w-8 text-blue-500" />
                            )}
                            {activity.status === 'warning' && (
                              <Clock className="h-8 w-8 text-yellow-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <p className="text-sm text-gray-900">{activity.message}</p>
                              <p className="mt-1 text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Status</h2>
          <p className="mt-1 text-sm text-gray-500">Current system health and statistics</p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="ml-2 text-sm text-gray-600">Database Connected</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="ml-2 text-sm text-gray-600">API Services Online</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="ml-2 text-sm text-gray-600">Authentication Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
