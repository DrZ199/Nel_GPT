"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "react-hot-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { MedicalHeader } from "@/components/MedicalHeader";
import { SplashScreen } from "@/components/SplashScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
  }, []);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewSession = () => {
    setCurrentSessionId(undefined);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className={cn(
        "min-h-screen bg-background text-foreground transition-colors duration-200",
        darkMode && "dark"
      )}>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              onSessionSelect={handleSessionSelect}
              currentSessionId={currentSessionId}
              onNewSession={handleNewSession}
            />
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <MedicalHeader />
              
              <main className="flex-1 overflow-hidden">
                <ChatInterface 
                  sessionId={currentSessionId || undefined}
                  onSessionCreated={(sessionId) => setCurrentSessionId(sessionId)}
                />
              </main>
            </div>
          </div>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              className: "medical-glass",
              duration: 4000,
            }}
          />
        </SidebarProvider>
      </div>
    </QueryClientProvider>
  );
}
