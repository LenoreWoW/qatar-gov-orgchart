import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Shield, AlertCircle, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher, useRTL } from '../ui/LanguageSwitcher';
import { clsx } from 'clsx';
import type { LoginRequest } from '../../types/api';

interface LoginFormData {
  username: string;
  password: string;
  remember_me: boolean;
}

export const LoginForm: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: '',
      password: '',
      remember_me: false,
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-qatar-maroon/95 via-qatar-maroon to-red-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+Cjwvc3ZnPg==')] opacity-20"></div>

      <div className="relative w-full max-w-md">
        {/* Language Switcher */}
        <div className={clsx('flex mb-8', isRTL ? 'justify-start' : 'justify-end')}>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <LanguageSwitcher variant="toggle" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-qatar-maroon to-red-800 rounded-2xl p-4 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Sparkles className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.welcomeTitle')}
            </h1>
            <p className="text-lg font-medium text-qatar-maroon mb-1">
              {t('auth.welcomeSubtitle')}
            </p>
            <p className="text-sm text-gray-600">
              {t('auth.welcomeDescription')}
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
                <div className={clsx('flex', isRTL && 'flex-row-reverse')}>
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className={clsx(isRTL ? 'mr-3' : 'ml-3')}>
                    <h3 className="text-sm font-medium text-red-800">Authentication Failed</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className={clsx(
                  'block text-sm font-semibold text-gray-700',
                  isRTL && 'text-right'
                )}
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                  })}
                  type="text"
                  autoComplete="username"
                  className={clsx(
                    'block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl',
                    'focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent',
                    'bg-gray-50/50 placeholder-gray-400 text-gray-900',
                    'transition-all duration-200 ease-in-out',
                    errors.username && 'border-red-300 focus:ring-red-500',
                    isRTL && 'text-right pr-10 pl-3'
                  )}
                  placeholder="Enter username (admin)"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {isRTL && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className={clsx('text-sm text-red-600', isRTL && 'text-right')}>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className={clsx(
                  'block text-sm font-semibold text-gray-700',
                  isRTL && 'text-right'
                )}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 4,
                      message: 'Password must be at least 4 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={clsx(
                    'block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl',
                    'focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent',
                    'bg-gray-50/50 placeholder-gray-400 text-gray-900',
                    'transition-all duration-200 ease-in-out',
                    errors.password && 'border-red-300 focus:ring-red-500',
                    isRTL && 'text-right pr-10 pl-12'
                  )}
                  placeholder="Enter password (admin)"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {isRTL && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  className={clsx(
                    'absolute inset-y-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors',
                    isRTL ? 'left-0' : 'right-0'
                  )}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={clsx('text-sm text-red-600', isRTL && 'text-right')}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('remember_me')}
                  id="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded transition-colors"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700 font-medium">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-qatar-maroon hover:text-qatar-maroon/80 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-qatar-maroon to-red-800 hover:from-qatar-maroon/90 hover:to-red-800/90
                         text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                         focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         transition-all duration-200 ease-in-out"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Sign In Securely
                </>
              )}
            </button>

            {/* Demo Credentials */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Demo Access</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    Username: <span className="font-mono font-semibold">admin</span> |
                    Password: <span className="font-mono font-semibold">admin</span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              🔒 This is a secure government system. All activities are monitored and logged.
            </p>
          </div>
        </div>

        {/* Footer Credits */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            Qatar Government Organization Chart System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};
