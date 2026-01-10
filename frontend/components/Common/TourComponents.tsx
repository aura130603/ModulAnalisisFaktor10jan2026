import type { FC} from "react";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourStep } from "@/types/tourTypes";

// Portal wrapper for the tour popup
export const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted && typeof window !== "undefined" 
    ? createPortal(children, document.body) 
    : null;
};

// Highlight component for the active element
export const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
  if (!active) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none"
      data-testid="tour-element-highlight"
    />
  );
};

// Main tour popup component
export const TourPopup: FC<{
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  targetElement: HTMLElement | null;
}> = ({ 
  step, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev, 
  onClose, 
  targetElement 
}) => {
  const position = step.position || step.defaultPosition;
  const horizontalPosition = step.horizontalPosition;
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Calculate popup position dynamically
  useEffect(() => {
    if (!targetElement) return;
    
    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const popupHeight = popupRef.current?.offsetHeight || 170;
      const popupWidth = 280;
      const popupBuffer = 20;
      let top: number, left: number;
      
      // Position based on horizontal position preference
      if (horizontalPosition === 'left') {
        // Position to the left of the element
        left = Math.max(10, rect.left - popupWidth - popupBuffer);
        
        // If there's not enough space on the left, try the right side
        if (left < 10) {
          left = rect.right + popupBuffer;
        }
        
        // Vertical positioning - center align with the element when using horizontal positioning
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
      } else if (horizontalPosition === 'right') {
        // Position to the right of the element
        left = rect.right + popupBuffer;
        
        // If there's not enough space on the right, try the left side
        if (left + popupWidth > window.innerWidth - 10) {
          left = Math.max(10, rect.left - popupWidth - popupBuffer);
        }
        
        // Center align vertically
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
      } else {
        // Standard top/bottom positioning
        if (position === 'top') {
          top = rect.top - (popupHeight + popupBuffer);
          // If not enough space above, move below
          if (top < 20) {
            top = rect.bottom + popupBuffer;
            step.position = 'bottom'; // Update for arrow
          }
        } else {
          top = rect.bottom + popupBuffer;
        }
        
        // Horizontal positioning - center align by default
        const elementWidth = rect.width;
        left = rect.left + (elementWidth / 2) - (popupWidth / 2);
      }
      
      // Keep within viewport bounds
      if (top < 10) top = 10;
      if (top + popupHeight > window.innerHeight - 10) {
        top = window.innerHeight - popupHeight - 10;
      }
      
      if (left < 10) left = 10;
      if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
      }
      
      setPopupPosition({ top, left });
    };
    
    // Update position
    updatePosition();
    const timer = setTimeout(updatePosition, 100);
    
    // Event listeners
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement, position, horizontalPosition, step]);

  // Dynamic arrow styling
  const getArrowStyles = () => {
    const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
    const borderClasses = "border-primary/10 dark:border-primary/20";
    
    if (horizontalPosition === 'left') {
      // Arrow pointing to the right
      return (
        <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-r ${borderClasses}`} />
      );
    } else if (horizontalPosition === 'right') {
      // Arrow pointing to the left
      return (
        <div className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-b border-l ${borderClasses}`} />
      );
    } else if (position === 'top') {
      // Arrow pointing down
      return (
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />
      );
    } else {
      // Arrow pointing up (bottom position)
      return (
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />
      );
    }
  };

  return (
    <TourPopupPortal>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? 10 : -10, x: horizontalPosition === 'left' ? -10 : 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          width: '280px',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}
        className="popup-tour-fixed"
        data-testid="tour-popup-container"
      >
        <Card 
          ref={popupRef}
          className={cn(
            "shadow-lg border-primary/10 dark:border-primary/20 rounded-lg",
            "relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
          )}
          data-testid="tour-popup-card"
        >
          {getArrowStyles()}
          
          <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20" data-testid="tour-popup-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step.icon && <span className="text-lg" data-testid="tour-popup-icon">{step.icon}</span>}
                <CardTitle className="text-base font-medium" data-testid="tour-popup-title">{step.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10" data-testid="tour-popup-close-button">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1" data-testid="tour-popup-step-counter">
              Step {currentStep + 1} of {totalSteps}
            </div>
          </CardHeader>
          
          <CardContent className="p-3 text-sm" data-testid="tour-popup-content">
            <div className="flex space-x-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p data-testid="tour-popup-description">{step.content}</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20" data-testid="tour-popup-footer">
            <div>
              {currentStep !== 0 && (
                <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0" data-testid="tour-popup-prev-button">
                  <ChevronLeft className="mr-1 h-3 w-3" />
                  <span className="text-xs">Previous</span>
                </Button>
              )}
            </div>
            <div>
              {currentStep + 1 !== totalSteps ? (
                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0" data-testid="tour-popup-next-button">
                  <span className="text-xs">Next</span>
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700" data-testid="tour-popup-finish-button">
                  <span className="text-xs">Finish</span>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </TourPopupPortal>
  );
};