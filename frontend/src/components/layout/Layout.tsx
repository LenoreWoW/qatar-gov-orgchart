import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  Home,
  Network,
  Users,
  Settings,
  Tag,
  LogOut,
  User,
  Shield,
  FileText,
  Database,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher, useRTL } from '../ui/LanguageSwitcher';
import { getUserPermissions, getRoleDisplayName } from '../../utils/permissions';
import { clsx } from 'clsx';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const location = useLocation();

  const navigation: NavigationItem[] = useMemo(() => {
    const permissions = getUserPermissions(user);
    const navItems: NavigationItem[] = [];

    // Always show dashboard
    if (permissions.canAccessDashboard) {
      navItems.push({ name: t('navigation.dashboard'), href: '/dashboard', icon: Home });
    }

    // Organization chart - always visible but functionality varies by role
    navItems.push({ name: t('navigation.organizationChart'), href: '/organization-chart', icon: Network });

    // Positions - visible to admin and planner
    if (permissions.canViewPosition) {
      navItems.push({ name: t('navigation.positions'), href: '/positions', icon: Users });
    }

    // Attributes - visible to admin only currently
    if (permissions.canCreatePosition || permissions.canManageKeyResponsibilities) {
      navItems.push({ name: t('navigation.attributes'), href: '/attributes', icon: Tag });
    }

    // Admin-only features
    if (permissions.canManageUsers) {
      navItems.push({ name: t('navigation.users'), href: '/users', icon: Settings });
    }

    if (permissions.canAccessCompliance) {
      navItems.push({ name: t('navigation.compliance'), href: '/compliance', icon: FileText });
      navItems.push({ name: t('navigation.dataRetention'), href: '/data-retention', icon: Database });
    }

    if (permissions.canExportData) {
      navItems.push({ name: t('navigation.exports'), href: '/exports', icon: Download });
    }

    return navItems;
  }, [user, t]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={clsx('fixed inset-0 flex z-40 md:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-qatar-maroon md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">{/* Search would go here */}</div>
            <div className={clsx('flex items-center space-x-4', isRTL && 'space-x-reverse')}>
              {/* Language Switcher */}
              <LanguageSwitcher variant="toggle" />

              {/* User menu */}
              <div className="relative">
                <div className={clsx('flex items-center space-x-4', isRTL && 'space-x-reverse')}>
                  <div className={clsx('text-right', isRTL && 'text-left')}>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role ? getRoleDisplayName(user.role as 'admin' | 'planner' | 'hr') : 'User'}
                    </p>
                  </div>
                  <div className="bg-qatar-maroon rounded-full p-2">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 p-2"
                    title={t('navigation.logout')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8 max-w-none">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar content component
const SidebarContent: React.FC<{
  navigation: NavigationItem[];
  currentPath: string;
}> = React.memo(({ navigation, currentPath }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <div
      className={clsx(
        'flex flex-col h-0 flex-1 bg-white',
        isRTL ? 'border-l border-gray-200' : 'border-r border-gray-200'
      )}
    >
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className={clsx('flex items-center flex-shrink-0 px-4', isRTL && 'flex-row-reverse')}>
          <div className="bg-qatar-maroon rounded-lg p-2">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className={clsx(isRTL ? 'mr-3' : 'ml-3')}>
            <h1 className="text-lg font-semibold text-gray-900">{t('auth.welcomeTitle')}</h1>
            <p className="text-xs text-gray-500">{t('auth.welcomeSubtitle')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map(item => {
            const isCurrent = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isCurrent
                    ? 'bg-qatar-maroon text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  isRTL && 'flex-row-reverse text-right'
                )}
              >
                <item.icon
                  className={clsx(
                    'flex-shrink-0 h-5 w-5',
                    isRTL ? 'ml-3' : 'mr-3',
                    isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          <p>Qatar Government</p>
          <p>Organization Chart System v1.0</p>
        </div>
      </div>
    </div>
  );
});
