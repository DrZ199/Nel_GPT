"use client";

import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getChatSessions, ChatSession } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { MedicalToolsDialog } from "./MedicalToolsDialog";
import {
  MessageSquare,
  Plus,
  History,
  Calculator,
  Heart,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Stethoscope,
  Activity,
  Users,
  PillIcon,
  FileText,
  Search,
  Clock,
  Loader2,
} from "lucide-react";

interface AppSidebarProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onSessionSelect?: (sessionId: string) => void;
  currentSessionId?: string;
  onNewSession?: () => void;
}

export function AppSidebar({ 
  darkMode, 
  setDarkMode, 
  onSessionSelect,
  currentSessionId,
  onNewSession
}: AppSidebarProps) {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [medicalToolsOpen, setMedicalToolsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>("dosing");
  
  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);
  
  const loadChatSessions = async () => {
    setIsLoadingHistory(true);
    try {
      const sessions = await getChatSessions(20); // Get last 20 sessions
      setChatHistory(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleSessionClick = (sessionId: string) => {
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };
  
  const handleNewSession = () => {
    if (onNewSession) {
      onNewSession();
    }
  };

  const medicalTools = [
    {
      id: "dosing",
      title: "Dosing Calculator",
      icon: Calculator,
      description: "Pediatric medication dosing",
      badge: "New",
    },
    {
      id: "growth",
      title: "Growth Charts",
      icon: BarChart3,
      description: "Percentile lookup & tracking",
    },
    {
      id: "emergency",
      title: "Emergency Protocols",
      icon: AlertTriangle,
      description: "NRP, PALS, BLS guidelines",
      badge: "Critical",
    },
    {
      id: "drug-reference",
      title: "Drug Reference",
      icon: PillIcon,
      description: "Pediatric pharmacology",
      badge: "Soon",
    },
  ];

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    setMedicalToolsOpen(true);
  };

  const quickAccess = [
    {
      title: "Cardiology",
      icon: Heart,
      count: 142,
    },
    {
      title: "Neonatology", 
      icon: Activity,
      count: 89,
    },
    {
      title: "Infectious Disease",
      icon: Stethoscope,
      count: 203,
    },
    {
      title: "Development",
      icon: Users,
      count: 67,
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return days === 1 ? '1d ago' : `${days}d ago`;
    }
  };

  return (
    <Sidebar variant="inset" className="medical-glass border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Nelson-GPT</h2>
            <p className="text-xs text-muted-foreground">Pediatric AI Assistant</p>
          </div>
        </div>
        
        <Button className="w-full mt-3 medical-gradient" onClick={handleNewSession}>
          <Plus className="h-4 w-4 mr-2" />
          New Consultation
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Recent Consultations
            {isLoadingHistory && (
              <Loader2 className="h-3 w-3 animate-spin ml-1" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[200px]">
              <SidebarMenu>
                {chatHistory.length === 0 && !isLoadingHistory ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No recent conversations
                  </div>
                ) : (
                  chatHistory.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton 
                        className={cn(
                          "w-full justify-start p-3 h-auto",
                          currentSessionId === session.id && "bg-primary/10 border-primary/20"
                        )}
                        onClick={() => handleSessionClick(session.id)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {session.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(session.last_message_at)}
                              </span>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {session.message_count}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Medical Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {medicalTools.map((tool) => (
                <SidebarMenuItem key={tool.title}>
                  <SidebarMenuButton 
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleToolClick(tool.id)}
                    disabled={tool.id === "drug-reference"}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <tool.icon className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tool.title}</span>
                          {tool.badge && (
                            <Badge 
                              variant={tool.badge === "Critical" ? "destructive" : "default"}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {tool.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccess.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.count}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Dark Mode</span>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Nelson Textbook of Pediatrics
            </p>
            <p className="text-xs text-muted-foreground text-center font-mono">
              22nd Edition • 2025
            </p>
          </div>
        </div>
      </SidebarFooter>
      
      <MedicalToolsDialog
        open={medicalToolsOpen}
        onOpenChange={setMedicalToolsOpen}
        defaultTab={selectedTool}
      />
    </Sidebar>
  );
}