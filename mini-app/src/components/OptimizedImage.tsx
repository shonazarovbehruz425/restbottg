import React, { useState, useEffect, useRef } from 'react';
import { Utensils } from 'lucide-react';
import { FALLBACK_IMAGE } from '../lib/api';

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
  loading = 'eager',
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // Keshda bo'lsa darhol isLoaded=true qilish
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }

    // Fail-safe: Agar brauzer onLoad chaqirmasa ham, 500ms dan keyin skeletonni olib tashlash
    const timer = setTimeout(() => {
      if (imgRef.current && imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [src]);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden w-full h-full bg-[#EBF1EC] dark:bg-[#141C16] ${wrapperClassName}`}
    >
      {/* Skeleton fon (rasm orqasida turadi, rasmni to'sib qo'ymaydi) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200/60 dark:bg-neutral-800/60 pointer-events-none">
          <Utensils className="w-5 h-5 text-neutral-400/40 dark:text-neutral-600/40 animate-pulse" />
        </div>
      )}

      {/* Rasm: Doimo ko'rinadi (opacity-0 yo'qolgan), pixels kelishi bilan darhol chiqadi */}
      {src && !hasError ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (imgRef.current && imgRef.current.src !== FALLBACK_IMAGE) {
              imgRef.current.src = FALLBACK_IMAGE;
              setIsLoaded(true);
            } else {
              setHasError(true);
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover ${className}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 p-2">
          <Utensils className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-[10px] font-medium opacity-60">Rasm yo'q</span>
        </div>
      )}
    </div>
  );
};
