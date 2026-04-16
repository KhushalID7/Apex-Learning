import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton = ({ width = '100%', height = '1rem', className = '' }: SkeletonProps) => {
  return (
    <div
      className={`bg-gray-300 animate-pulse rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard = ({ rows = 3 }: { rows?: number }) => {
  const placeholders = Array.from({ length: rows });
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <Skeleton width="100%" height="180px" className="mb-4" />
      {placeholders.map((_, i) => (
        <Skeleton key={i} width="80%" height="1rem" className="mb-2" />
      ))}
    </div>
  );
};
