"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to animate the skeleton
   */
  animate?: boolean
}

function Skeleton({
  className,
  animate = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        animate && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton for organization chart cards
 */
function OrgCardSkeleton({ isRTL = false }: { isRTL?: boolean }) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md border p-4 w-72 mx-auto mb-4",
      isRTL && "text-right"
    )}>
      {/* Header with avatar and title */}
      <div className={cn(
        "flex items-start gap-3 mb-3",
        isRTL && "flex-row-reverse"
      )}>
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Department */}
      <div className="mb-3">
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Stats */}
      <div className={cn(
        "flex justify-between items-center",
        isRTL && "flex-row-reverse"
      )}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

/**
 * Skeleton for the tree view
 */
function TreeViewSkeleton({ isRTL = false }: { isRTL?: boolean }) {
  return (
    <div className="space-y-8">
      {/* Root level */}
      <div className="flex justify-center">
        <OrgCardSkeleton isRTL={isRTL} />
      </div>

      {/* Second level */}
      <div className={cn(
        "flex justify-center gap-8 flex-wrap",
        isRTL && "flex-row-reverse"
      )}>
        {[...Array(4)].map((_, i) => (
          <OrgCardSkeleton key={i} isRTL={isRTL} />
        ))}
      </div>

      {/* Third level */}
      <div className={cn(
        "flex justify-center gap-6 flex-wrap",
        isRTL && "flex-row-reverse"
      )}>
        {[...Array(6)].map((_, i) => (
          <OrgCardSkeleton key={i} isRTL={isRTL} />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for the grid view
 */
function GridViewSkeleton({ isRTL = false }: { isRTL?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(12)].map((_, i) => (
        <OrgCardSkeleton key={i} isRTL={isRTL} />
      ))}
    </div>
  )
}

/**
 * Loading spinner component
 */
function LoadingSpinner({
  size = "md",
  className
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-qatar-maroon/20 border-t-qatar-maroon",
      sizeClasses[size],
      className
    )} />
  )
}

/**
 * Progress bar component
 */
function ProgressBar({
  progress,
  className,
  showLabel = false,
  label
}: {
  progress: number
  className?: string
  showLabel?: boolean
  label?: string
}) {
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label || "Loading..."}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-qatar-maroon h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

export {
  Skeleton,
  OrgCardSkeleton,
  TreeViewSkeleton,
  GridViewSkeleton,
  LoadingSpinner,
  ProgressBar
}