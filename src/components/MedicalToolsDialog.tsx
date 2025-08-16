"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calculator, 
  Heart, 
  TrendingUp, 
  Stethoscope,
  BookOpen,
  Clock,
  AlertTriangle
} from "lucide-react";
import { DosingCalculator, EmergencyProtocols, GrowthCharts } from "./medical-tools";

interface MedicalToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export function MedicalToolsDialog({ open, onOpenChange, defaultTab = "dosing" }: MedicalToolsDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tools = [
    {
      id: "dosing",
      name: "Dosing Calculator",
      description: "Evidence-based pediatric medication dosing",
      icon: Calculator,
      badge: "Nelson Guidelines",
      component: DosingCalculator
    },
    {
      id: "emergency",
      name: "Emergency Protocols",
      description: "NRP, PALS, and BLS algorithms",
      icon: Heart,
      badge: "AHA/AAP",
      component: EmergencyProtocols
    },
    {
      id: "growth",
      name: "Growth Charts",
      description: "WHO/CDC percentile calculations",
      icon: TrendingUp,
      badge: "WHO/CDC",
      component: GrowthCharts
    }
  ];

  const selectedTool = tools.find(tool => tool.id === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Medical Tools</DialogTitle>
              <DialogDescription>
                Professional pediatric healthcare utilities and calculators
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-1 min-h-0">
          {/* Tool Selection Sidebar */}
          <div className="w-64 border-r bg-muted/30 p-4">
            <div className="space-y-2">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant={activeTab === tool.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setActiveTab(tool.id)}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tool.description}
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {tool.badge}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Quick Access</h4>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setActiveTab("emergency")}
                >
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  Cardiac Arrest
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setActiveTab("dosing")}
                >
                  <Calculator className="h-3 w-3 mr-2" />
                  Amoxicillin Dosing
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setActiveTab("growth")}
                >
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Growth Percentiles
                </Button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-start gap-2">
                <BookOpen className="h-3 w-3 mt-0.5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Clinical Use Only</p>
                  <p className="mt-1">
                    These tools are for healthcare professionals. 
                    Always verify calculations and follow institutional protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {selectedTool && (
                  <selectedTool.component />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}