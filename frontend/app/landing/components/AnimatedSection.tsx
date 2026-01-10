'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0 
}: AnimatedSectionProps) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { 
      opacity: 0,
      y: 50
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier easing
        delay
      }
    }
  };

  // If not client-side yet, render without animation to avoid hydration mismatch
  if (!isClient) {
    return <div className={className}>{children}</div>;
  }

  // Client-side rendering with animation
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
};

// Export additional animated elements for convenience
export const AnimatedCard = motion.div;
export const AnimatedText = motion.div;
export const AnimatedImage = motion.img;