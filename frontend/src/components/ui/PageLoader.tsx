import React from 'react';
import { Shield } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = React.memo(({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Qatar Government Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-qatar-maroon rounded-full p-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="mb-4">
          <LoadingSpinner size="lg" />
        </div>

        {/* Loading Message */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <p className="text-sm text-gray-500">Qatar Government Organization Chart System</p>

        {/* Loading Animation */}
        <div className="mt-6 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-qatar-maroon rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-qatar-maroon rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="w-2 h-2 bg-qatar-maroon rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
});

// Smaller in-page loader for route transitions
export const RouteLoader: React.FC<PageLoaderProps> = React.memo(({ message = 'Loading page...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="mb-4">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
});

export default PageLoader;
