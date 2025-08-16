"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const totalDuration = 5000; // 5 seconds
    const updateInterval = 50; // Update every 50ms
    const totalUpdates = totalDuration / updateInterval;
    const progressIncrement = 100 / totalUpdates;

    let currentProgress = 0;

    const progressTimer = setInterval(() => {
      currentProgress += progressIncrement;
      setProgress(Math.min(currentProgress, 100));

      if (currentProgress >= 100) {
        clearInterval(progressTimer);
        
        // Fade out animation
        setTimeout(() => {
          setIsVisible(false);
        }, 200);

        // Complete splash screen
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, updateInterval);

    return () => clearInterval(progressTimer);
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-white",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="relative flex flex-col items-center text-center max-w-sm mx-auto px-6">
        {/* Main Logo */}
        <div className={cn(
          "transition-all duration-700 ease-out mb-6",
          progress > 10 ? "scale-100 opacity-100" : "scale-110 opacity-0"
        )}>
          <img 
            src="/nelson-main-logo.jpg" 
            alt="Nelson-GPT" 
            className="w-32 h-32 object-contain drop-shadow-sm"
          />
        </div>

        {/* Title */}
        <div className={cn(
          "mb-8 transition-all duration-700 ease-out delay-300",
          progress > 30 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Nelson-GPT
          </h1>
          <p className="text-gray-600 text-base">
            Smart Pediatric Assistant
          </p>
        </div>

        {/* Progress Bar */}
        <div className={cn(
          "w-full max-w-xs mb-8 transition-all duration-700 ease-out delay-500",
          progress > 50 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Progress 
            value={progress} 
            className="h-1 bg-gray-100"
          />
        </div>

        {/* Footer */}
        <div className={cn(
          "text-center transition-all duration-700 ease-out delay-700",
          progress > 70 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-xs text-gray-500">
            Powered by Nelson Book of Pediatrics
          </p>
        </div>
      </div>
    </div>
  );
}