import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "error" | "warning"
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  variant = "default" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  }

  const variants = {
    default: "text-teal-600",
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600"
  }

  const icons = {
    default: Loader2,
    success: CheckCircle2,
    error: AlertCircle,
    warning: Clock
  }

  const Icon = icons[variant]
  
  return (
    <Icon 
      className={cn(
        sizeClasses[size],
        variants[variant],
        variant === "default" && "animate-spin",
        className
      )} 
    />
  )
}

export interface LoadingPageProps {
  message?: string
  submessage?: string
  progress?: number
  className?: string
}

export function LoadingPage({ 
  message = "Loading...", 
  submessage,
  progress,
  className 
}: LoadingPageProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[200px] p-8 text-center",
      className
    )}>
      <div className="relative mb-4">
        <LoadingSpinner size="lg" />
        {progress !== undefined && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{message}</h3>
        {submessage && (
          <p className="text-sm text-gray-600 max-w-xs">{submessage}</p>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="w-full max-w-xs mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface LoadingStateProps {
  isLoading: boolean
  error?: Error | null
  retry?: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  className?: string
}

export function LoadingState({
  isLoading,
  error,
  retry,
  children,
  loadingComponent,
  errorComponent,
  className
}: LoadingStateProps) {
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }
    
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return <LoadingPage />
  }

  return <>{children}</>
}