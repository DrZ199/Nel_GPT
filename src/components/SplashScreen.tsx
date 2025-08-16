"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  BookOpen, 
  Brain, 
  Heart,
  Activity,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const phases = [
    { text: "Initializing Nelson-GPT", icon: Brain },
    { text: "Loading Medical Database", icon: BookOpen },
    { text: "Connecting to AI Services", icon: Activity },
    { text: "Preparing Medical Tools", icon: Stethoscope },
    { text: "Ready for Consultation", icon: Heart },
  ];

  useEffect(() => {
    const totalDuration = 5000; // 5 seconds
    const updateInterval = 50; // Update every 50ms
    const totalUpdates = totalDuration / updateInterval;
    const progressIncrement = 100 / totalUpdates;
    const phaseInterval = totalDuration / phases.length;

    let currentProgress = 0;
    let phaseIndex = 0;

    const progressTimer = setInterval(() => {
      currentProgress += progressIncrement;
      
      // Update phase based on progress
      const newPhaseIndex = Math.floor((currentProgress / 100) * phases.length);
      if (newPhaseIndex !== phaseIndex && newPhaseIndex < phases.length) {
        phaseIndex = newPhaseIndex;
        setCurrentPhase(phaseIndex);
      }

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
  }, [onComplete, phases.length]);

  const currentPhaseData = phases[currentPhase];
  const CurrentIcon = currentPhaseData?.icon || Brain;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-gradient-to-br from-blue-50 via-white to-blue-100",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Cpath d='M30 20c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10zm0 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex flex-col items-center text-center max-w-md mx-auto px-6">
        {/* Main Logo Animation */}
        <div className="relative mb-8">
          <div className={cn(
            "transition-all duration-700 ease-out",
            progress > 10 ? "scale-100 opacity-100" : "scale-110 opacity-0"
          )}>
            <img 
              src="/nelson-full-logo.jpg" 
              alt="Nelson-GPT" 
              className="w-48 h-auto drop-shadow-xl"
            />
          </div>
          
          {/* Floating stethoscope animation */}
          <div className={cn(
            "absolute -top-4 -right-4 transition-all duration-1000 ease-out",
            progress > 20 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="p-3 bg-primary/10 rounded-full animate-pulse">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className={cn(
          "mb-8 transition-all duration-700 ease-out delay-300",
          progress > 30 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Nelson-GPT
          </h1>
          <p className="text-muted-foreground text-lg">
            Pediatric Medical AI Assistant
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Nelson Textbook 22nd Edition
            </Badge>
            <Badge variant="outline">
              Powered by AI
            </Badge>
          </div>
        </div>

        {/* Progress Section */}
        <div className={cn(
          "w-full space-y-4 transition-all duration-700 ease-out delay-500",
          progress > 50 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {/* Current Phase Indicator */}
          <div className="flex items-center justify-center gap-3 min-h-[2rem]">
            <div className="p-2 bg-primary/10 rounded-full">
              <CurrentIcon className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {currentPhaseData?.text || "Initializing..."}
            </span>
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2 bg-muted/50"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className={cn(
          "flex flex-wrap justify-center gap-2 mt-8 transition-all duration-700 ease-out delay-700",
          progress > 70 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full text-xs text-blue-700">
            <BookOpen className="h-3 w-3" />
            Evidence-Based
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full text-xs text-green-700">
            <Heart className="h-3 w-3" />
            Pediatric Focus
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-full text-xs text-purple-700">
            <Brain className="h-3 w-3" />
            AI Powered
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "mt-8 text-center transition-all duration-700 ease-out delay-1000",
          progress > 85 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-xs text-muted-foreground">
            Professional medical tool for healthcare providers
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            v1.0.0 • 2025
          </p>
        </div>
      </div>

      {/* Animated Medical Icons Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute text-primary/5 animate-float",
              progress > 60 ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 2)}s`
            }}
          >
            {i % 4 === 0 && <Stethoscope className="h-8 w-8" />}
            {i % 4 === 1 && <Heart className="h-6 w-6" />}
            {i % 4 === 2 && <BookOpen className="h-7 w-7" />}
            {i % 4 === 3 && <Activity className="h-6 w-6" />}
          </div>
        ))}
      </div>
    </div>
  );
}