"use client";

import React, { useEffect, useRef } from "react";
import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const TourCard: React.FC<CardComponentProps> = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}) => {
  const { closeOnborda } = useOnborda();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Handle positioning within resizable panels
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    // Ensure card is not positioned outside its container
    const checkPosition = () => {
      const rect = card.getBoundingClientRect();
      const parentContainer = card.closest(".resize-content") || document.body;
      const parentRect = parentContainer.getBoundingClientRect();
      
      // Check horizontal overflow
      if (rect.right > parentRect.right) {
        card.style.transform = `translateX(${parentRect.right - rect.right - 10}px)`;
      }
      
      // Check vertical overflow
      if (rect.bottom > parentRect.bottom) {
        card.style.transform = `${card.style.transform || ''} translateY(${parentRect.bottom - rect.bottom - 10}px)`;
      }
    };
    
    // Run position check after a small delay to ensure tour is fully rendered
    setTimeout(checkPosition, 100);
    
    // Also listen for panel resize
    const resizeObserver = new ResizeObserver(checkPosition);
    const parentContainer = card.closest(".resize-content") || document.body;
    resizeObserver.observe(parentContainer);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [step]);

  function handleClose() {
    closeOnborda();
  }

  return (
    <Card ref={cardRef} className="w-[250px] shadow-lg border-primary/20 z-[9999] tour-card">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step.icon && <span className="text-lg">{step.icon}</span>}
            <CardTitle className="text-base">{step.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6">
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Langkah {currentStep + 1} dari {totalSteps}
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pb-2 text-xs">
        {step.content}
      </CardContent>
      
      <CardFooter className="flex justify-between p-3 pt-0 pb-2">
        <div>
          {currentStep !== 0 && (
            <Button variant="outline" size="sm" onClick={prevStep} className="h-7 px-2 py-0">
              <ChevronLeft className="mr-1 h-3 w-3" />
              <span className="text-xs">Sebelumnya</span>
            </Button>
          )}
        </div>
        <div>
          {currentStep + 1 !== totalSteps ? (
            <Button size="sm" onClick={nextStep} className="h-7 px-2 py-0">
              <span className="text-xs">Lanjut</span>
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700">
              <span className="text-xs">Selesai</span>
            </Button>
          )}
        </div>
      </CardFooter>
      <div className="text-primary arrow-container">{arrow}</div>
    </Card>
  );
}; 