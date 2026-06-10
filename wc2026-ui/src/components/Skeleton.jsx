import React from 'react'

export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-card rounded-card ${className}`}
    />
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-10 w-full mt-2" />
    </div>
  )
}
