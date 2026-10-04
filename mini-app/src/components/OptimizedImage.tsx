import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';

interface OptimizedImageProps {
  src?: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden w-full h-full ${wrapperClassName}`}
    >
      {/* Skeleton Shimmer */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-200/80 dark:bg-neutral-800/80 animate-pulse flex items-center justify-center">
          <Utensils className="w-5 h-5 text-neutral-400/50 dark:text-neutral-600/50 animate-bounce" />
        </div>
      )}

      {/* Fallback Error Placeholder */}
      {(hasError || !src) && (
        <div className="absolute inset-0 bg-neutral-100 dark:bg-[#162019] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 p-2">
          <Utensils className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-[10px] font-medium opacity-60">Rasm yo'q</span>
        </div>
      )}

      {/* Actual Image */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover ${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
