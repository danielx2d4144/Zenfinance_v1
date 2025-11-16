"use client";

import { useState } from "react";

interface AssetIconProps {
  icon: string;
  symbol?: string;
  className?: string;
}

/**
 * AssetIcon component that handles both emoji icons and image logos
 * For image logos, place the image in /public/logos/[symbol].png
 * Example: /public/logos/ZTC.png
 */
export default function AssetIcon({ icon, symbol, className = "" }: AssetIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Check if icon is an emoji (starts with special characters) or an image path
  const isEmoji = icon && /^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F900}-\u{1F9FF}]|[\u{2700}-\u{27BF}]/u.test(icon);
  
  // If icon is an emoji, render it directly (no need to try loading image)
  if (isEmoji) {
    return <span className={className}>{icon}</span>;
  }
  
  // If symbol is provided and icon is empty, try to load the image
  // Only attempt image loading when icon is empty (meaning we want to use an image)
  if (symbol && !icon) {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Silently handle image load errors - don't log to console
      setImageError(true);
      // Hide the broken image
      const target = e.target as HTMLImageElement;
      if (target) {
        target.style.display = 'none';
      }
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    return (
      <>
        <img
          src={`/logos/${symbol}.png`}
          alt={`${symbol} logo`}
          className={className}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageError ? 'none' : 'block' }}
        />
        {/* If image fails, show nothing (empty circle) */}
      </>
    );
  }
  
  // If symbol provided but icon is not empty and not emoji, render the icon
  if (symbol && icon) {
    return <span className={className}>{icon}</span>;
  }
  
  // If no icon and no symbol, return empty (blank circle)
  return null;
}

