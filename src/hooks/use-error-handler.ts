import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, options: ErrorOptions = {}) => {
    console.error('Error handled:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorDescription = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.cause) {
        errorDescription = String(error.cause);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message);
    }

    // Handle specific error types
    if (errorMessage.includes('fetch')) {
      errorMessage = 'Network connection failed';
      errorDescription = 'Please check your internet connection and try again';
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      errorMessage = 'Authentication required';
      errorDescription = 'Please log in to continue';
    } else if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      errorMessage = 'Access denied';
      errorDescription = 'You don\'t have permission to perform this action';
    } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      errorMessage = 'Resource not found';
      errorDescription = 'The requested item could not be found';
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      errorMessage = 'Server error';
      errorDescription = 'Please try again in a few moments';
    }

    toast.error(options.title || errorMessage, {
      description: options.description || errorDescription || undefined,
      duration: options.duration || 5000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });

    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: errorMessage,
        fatal: false,
      });
    }
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  const withErrorHandling = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    options: ErrorOptions = {}
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            handleError(error, options);
            throw error;
          });
        }
        return result;
      } catch (error) {
        handleError(error, options);
        throw error;
      }
    }) as T;
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    withErrorHandling,
  };
}