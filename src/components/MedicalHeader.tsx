"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search,
  BookOpen,
  Activity,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Shield,
  Database,
} from "lucide-react";
import { DatabaseStatus } from "@/components/DatabaseStatus";
import { testDatabaseConnection } from "@/lib/supabase";

export function MedicalHeader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState("");
  const [databaseConnected, setDatabaseConnected] = useState<boolean | null>(null);

  // Test database connection on mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const status = await testDatabaseConnection();
        setDatabaseConnected(status.connected);
      } catch (error) {
        console.error('Database check failed:', error);
        setDatabaseConnected(false);
      }
    };
    
    checkDatabase();
  }, []);

  // Mock user data - in production this would come from authentication
  const user = {
    name: "Dr. Sarah Chen",
    title: "Pediatric Resident",
    institution: "Children's Hospital of Philadelphia",
    initials: "SC",
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        
        <div className="hidden md:flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Medical Consultation</h1>
            <p className="text-xs text-muted-foreground">
              Evidence-based pediatric guidance
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Nelson Textbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-8"
          />
        </form>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className="text-xs hidden sm:inline-flex"
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Database Status */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Database 
                  className={`h-4 w-4 ${
                    databaseConnected === true 
                      ? 'text-green-500' 
                      : databaseConnected === false 
                        ? 'text-red-500' 
                        : 'text-yellow-500'
                  }`} 
                />
                {databaseConnected === false && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Database Connection Status</DialogTitle>
              </DialogHeader>
              <DatabaseStatus />
            </DialogContent>
          </Dialog>

          {/* Medical Verification Badge */}
          <Badge variant="outline" className="gap-1 hidden md:inline-flex">
            <Shield className="h-3 w-3" />
            <span className="text-xs">Evidence-Based</span>
          </Badge>

          {/* Activity Indicator */}
          <Button variant="ghost" size="sm" className="relative">
            <Activity className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </Button>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {user.initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {user.initials}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {user.title}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Institution:</strong> {user.institution}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Session:</strong> Evidence-based responses only
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}