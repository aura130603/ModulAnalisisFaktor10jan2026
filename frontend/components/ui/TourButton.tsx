"use client";

import React from "react";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useTour } from "@/hooks/useTour";
import { cn } from "@/lib/utils";

interface TourButtonProps extends Omit<ButtonProps, "onClick"> {
  tourName: string;
  label?: string;
  iconOnly?: boolean;
}

/**
 * TourButton - Button to trigger product tours
 * 
 * Displays a help button that starts a specific product tour when clicked
 */
export const TourButton: React.FC<TourButtonProps> = ({
  tourName,
  label = "Bantuan",
  iconOnly = false,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}) => {
  const { startTour } = useTour();
  
  const handleClick = () => {
    startTour(tourName);
  };
  
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleClick}
      className={cn(
        "group",
        iconOnly ? "px-2" : "", 
        className
      )}
      {...props}
    >
      <HelpCircle className={cn(
        "h-4 w-4 transition-colors",
        iconOnly ? "" : "mr-2"
      )} />
      {!iconOnly && label}
    </Button>
  );
};

export default TourButton; 