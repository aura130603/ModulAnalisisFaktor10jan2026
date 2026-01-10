"use client"; // Add use client directive

import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isMobile: boolean;
  shouldPrompt: boolean;
}

const checkIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false; // Check if window is defined (for SSR)
  // Basic check for mobile user agents
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const getIsPortrait = (): boolean => {
  if (typeof window === 'undefined') return true; // Default to portrait if window is not defined
  // Use screen.orientation for modern browsers if available, otherwise fallback
  if (window.screen.orientation) {
    return window.screen.orientation.type.startsWith('portrait');
  }
  // Fallback for older browsers using matchMedia
  if (window.matchMedia) {
    return window.matchMedia("(orientation: portrait)").matches;
  }
  // Final fallback comparing height and width
  return window.innerHeight > window.innerWidth;
};

export function useMobile(): OrientationState {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(true);

  useEffect(() => {
    // Initial check on mount
    const mobileCheck = checkIsMobile();
    const portraitCheck = getIsPortrait();
    setIsMobile(mobileCheck);
    setIsPortrait(portraitCheck);

    const handleOrientationChange = () => {
      setIsPortrait(getIsPortrait());
    };

    // Add listener for orientation changes
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else if (window.matchMedia) {
      // Fallback for older browsers
      const mediaQuery = window.matchMedia("(orientation: portrait)");
      // Check if addEventListener is supported (newer API)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => handleOrientationChange());
      } else {
        // Deprecated addListener for older browsers
        mediaQuery.addListener((e) => handleOrientationChange());
      }
    } else {
      // Fallback for very old browsers: listen to resize
      window.addEventListener('resize', handleOrientationChange);
    }

    // Cleanup function
    return () => {
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(orientation: portrait)");
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', (e) => handleOrientationChange());
        } else {
          mediaQuery.removeListener((e) => handleOrientationChange());
        }
      } else {
        window.removeEventListener('resize', handleOrientationChange);
      }
    };
  }, []);

  const shouldPrompt = isMobile && isPortrait;

  return { isPortrait, isMobile, shouldPrompt };
} 