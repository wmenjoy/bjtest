/**
 * LoadingState - Reusable loading indicator
 *
 * Follows frontend design system:
 * - Blue spinner (text-blue-500)
 * - Centered layout
 * - Optional message
 */

import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 24,
  className = 'p-8'
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader className="animate-spin text-blue-500" size={size} />
      {message && (
        <span className="ml-2 text-slate-600 text-sm">{message}</span>
      )}
    </div>
  );
};

/**
 * ErrorState - Reusable error display
 *
 * Follows frontend design system:
 * - Red background (bg-red-50)
 * - Red border (border-red-200)
 * - Red text (text-red-600)
 * - Rounded corners (rounded-lg)
 */

interface ErrorStateProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  className = 'p-4',
  onRetry
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-red-600 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * EmptyState - Reusable empty state display
 *
 * Follows frontend design system:
 * - Centered layout
 * - Slate colors
 * - Icon + text
 */

import { FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  className = 'p-8'
}) => {
  return (
    <div className={`text-center text-slate-400 text-sm ${className}`}>
      {icon || <FileX className="mx-auto mb-2 text-slate-300" size={48} />}
      <p>{message}</p>
    </div>
  );
};

/**
 * Toast - Success notification
 *
 * Follows frontend design system:
 * - Fixed position (top-right)
 * - Green theme
 * - Auto-dismiss animation
 */

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose
}) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 border rounded-lg shadow-lg animate-fade-in ${bgColors[type]}`}>
      <p>{message}</p>
    </div>
  );
};
