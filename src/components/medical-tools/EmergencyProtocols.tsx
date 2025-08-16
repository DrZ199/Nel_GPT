"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Baby, 
  Users, 
  Zap,
  Timer,
  PhoneCall,
  Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtocolStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
  critical?: boolean;
  medications?: {
    name: string;
    dose: string;
    route: string;
    notes?: string;
  }[];
}

interface EmergencyProtocol {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  ageGroup: string;
  steps: ProtocolStep[];
  medications: {
    epinephrine?: string;
    atropine?: string;
    amiodarone?: string;
    adenosine?: string;
  };
  vitalSigns: {
    heartRate: string;
    respiratoryRate: string;
    bloodPressure: string;
  };
}

const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: "nrp",
    name: "Neonatal Resuscitation Program",
    abbreviation: "NRP",
    description: "Evidence-based approach to neonatal resuscitation",
    ageGroup: "Newborn (0-28 days)",
    steps: [
      {
        step: 1,
        title: "Initial Assessment",
        description: "Term gestation? Crying or breathing? Good muscle tone?",
        duration: "30 seconds",
        critical: true
      },
      {
        step: 2,
        title: "Warmth & Positioning",
        description: "Provide warmth, position head/neck, clear secretions if needed",
        duration: "30 seconds"
      },
      {
        step: 3,
        title: "Stimulate & Oxygenation",
        description: "Dry and stimulate. Assess breathing and heart rate",
        duration: "30 seconds"
      },
      {
        step: 4,
        title: "Positive Pressure Ventilation",
        description: "If HR <100 or gasping/apnea: PPV with 21-30% O2 (term) or 21-30% (preterm)",
        duration: "30 seconds",
        critical: true
      },
      {
        step: 5,
        title: "Assess Response",
        description: "Check heart rate and breathing response to PPV",
        duration: "30 seconds"
      },
      {
        step: 6,
        title: "Chest Compressions",
        description: "If HR <60 despite adequate PPV: Start compressions 3:1 with PPV",
        duration: "60 seconds",
        critical: true
      },
      {
        step: 7,
        title: "Medications",
        description: "If HR <60 after adequate PPV and compressions: Epinephrine",
        medications: [
          {
            name: "Epinephrine",
            dose: "0.1-0.3 mL/kg of 1:10,000",
            route: "IV/UVC (preferred) or ETT",
            notes: "Repeat every 3-5 minutes if indicated"
          }
        ]
      }
    ],
    medications: {
      epinephrine: "0.1-0.3 mL/kg of 1:10,000 (0.01-0.03 mg/kg)"
    },
    vitalSigns: {
      heartRate: "Normal: >100 bpm",
      respiratoryRate: "Normal: 30-60/min",
      bloodPressure: "Systolic: 60-90 mmHg"
    }
  },
  {
    id: "pals",
    name: "Pediatric Advanced Life Support",
    abbreviation: "PALS",
    description: "Systematic approach to pediatric cardiac arrest and emergency care",
    ageGroup: "Infants & Children (1 month - puberty)",
    steps: [
      {
        step: 1,
        title: "Scene Safety & Recognition",
        description: "Ensure scene safety. Recognize cardiac arrest or respiratory emergency",
        critical: true
      },
      {
        step: 2,
        title: "Activate Emergency Response",
        description: "Call for help, request defibrillator/monitor",
        duration: "Immediate"
      },
      {
        step: 3,
        title: "Assess & Position",
        description: "Check responsiveness and pulse (≤10 seconds)",
        duration: "10 seconds",
        critical: true
      },
      {
        step: 4,
        title: "CPR - Compressions",
        description: "30:2 (1 rescuer) or 15:2 (2 rescuers). Rate 100-120/min, depth ≥1/3 AP diameter",
        duration: "2 minutes cycles",
        critical: true
      },
      {
        step: 5,
        title: "Defibrillation",
        description: "Attach AED/manual defibrillator. Analyze rhythm",
        critical: true
      },
      {
        step: 6,
        title: "Advanced Airway",
        description: "Bag-mask → Consider advanced airway (ETT, LMA)",
        duration: "Continuous"
      },
      {
        step: 7,
        title: "Medications",
        description: "Establish IV/IO access. Administer medications per algorithm",
        medications: [
          {
            name: "Epinephrine",
            dose: "0.01 mg/kg (0.1 mL/kg of 1:10,000)",
            route: "IV/IO every 3-5 minutes",
            notes: "First-line medication"
          },
          {
            name: "Amiodarone",
            dose: "5 mg/kg IV/IO",
            route: "IV/IO for VF/pVT",
            notes: "After epinephrine and defibrillation"
          }
        ]
      }
    ],
    medications: {
      epinephrine: "0.01 mg/kg (0.1 mL/kg of 1:10,000) IV/IO q3-5min",
      amiodarone: "5 mg/kg IV/IO for VF/pVT",
      adenosine: "0.1 mg/kg (max 6 mg) rapid IV push for SVT"
    },
    vitalSigns: {
      heartRate: "Infant: 100-160, Child: 70-120 bpm",
      respiratoryRate: "Infant: 30-60, Child: 20-30/min",
      bloodPressure: "Systolic: 70 + (2 × age in years) mmHg"
    }
  },
  {
    id: "bls",
    name: "Basic Life Support",
    abbreviation: "BLS",
    description: "Fundamental life-saving skills for cardiac arrest",
    ageGroup: "All ages",
    steps: [
      {
        step: 1,
        title: "Scene Safety",
        description: "Ensure scene is safe for you, victim, and bystanders",
        critical: true
      },
      {
        step: 2,
        title: "Check Responsiveness",
        description: "Tap shoulders (adult/child) or flick feet (infant). Shout 'Are you okay?'",
        duration: "5-10 seconds"
      },
      {
        step: 3,
        title: "Call for Help",
        description: "Call 911 and request AED. If available, send someone else",
        duration: "Immediate",
        critical: true
      },
      {
        step: 4,
        title: "Check Pulse",
        description: "Carotid (adult/child) or brachial (infant) pulse",
        duration: "≤10 seconds"
      },
      {
        step: 5,
        title: "Begin CPR",
        description: "If no pulse or unsure: Start chest compressions immediately",
        critical: true
      },
      {
        step: 6,
        title: "Chest Compressions",
        description: "Rate: 100-120/min, Depth: ≥2 inches (adult), ≥1/3 AP diameter (child/infant)",
        duration: "Continuous cycles",
        critical: true
      },
      {
        step: 7,
        title: "Rescue Breathing",
        description: "30:2 ratio (adult), 30:2 (child/infant single rescuer), 15:2 (2 rescuer child)",
        duration: "2-minute cycles"
      },
      {
        step: 8,
        title: "Use AED",
        description: "Attach AED pads, ensure no one touching, analyze and shock if advised",
        critical: true
      }
    ],
    medications: {},
    vitalSigns: {
      heartRate: "Adult: 60-100, Child: 70-120, Infant: 100-160 bpm",
      respiratoryRate: "Adult: 12-20, Child: 20-30, Infant: 30-60/min",
      bloodPressure: "Age-appropriate ranges"
    }
  }
];

export function EmergencyProtocols() {
  const [selectedProtocol, setSelectedProtocol] = useState<string>("pals");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const currentProtocol = EMERGENCY_PROTOCOLS.find(p => p.id === selectedProtocol);

  const startTimer = () => {
    setTimerActive(true);
    setTimer(0);
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimer(0);
    setTimerActive(false);
    setActiveStep(0);
  };

  // Timer effect would go here in a real implementation
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentProtocol) return null;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <CardTitle>Emergency Protocols</CardTitle>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <div className="text-lg font-mono font-bold">
                {formatTime(timer)}
              </div>
            </div>
            
            {/* Timer Controls */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timerActive ? "destructive" : "default"}
                onClick={timerActive ? stopTimer : startTimer}
              >
                {timerActive ? "Stop" : "Start"} Timer
              </Button>
              <Button size="sm" variant="outline" onClick={resetTimer}>
                Reset
              </Button>
            </div>
          </div>
        </div>
        <CardDescription>
          Critical care algorithms for pediatric emergencies - Based on AHA/AAP Guidelines
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedProtocol} onValueChange={setSelectedProtocol}>
          <TabsList className="grid w-full grid-cols-3">
            {EMERGENCY_PROTOCOLS.map((protocol) => (
              <TabsTrigger key={protocol.id} value={protocol.id} className="flex items-center gap-2">
                {protocol.id === 'nrp' && <Baby className="h-4 w-4" />}
                {protocol.id === 'pals' && <Users className="h-4 w-4" />}
                {protocol.id === 'bls' && <Heart className="h-4 w-4" />}
                {protocol.abbreviation}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedProtocol} className="mt-6">
            <div className="space-y-6">
              {/* Protocol Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{currentProtocol.name}</h2>
                  <p className="text-muted-foreground">{currentProtocol.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {currentProtocol.ageGroup}
                  </Badge>
                </div>
                
                {/* Emergency Contact Reminder */}
                <Alert className="w-fit">
                  <PhoneCall className="h-4 w-4" />
                  <AlertDescription className="font-semibold">
                    Call 911 / Activate Code Blue
                  </AlertDescription>
                </Alert>
              </div>

              {/* Protocol Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Algorithm Steps</h3>
                
                <div className="grid gap-4">
                  {currentProtocol.steps.map((step, index) => (
                    <Card 
                      key={step.step}
                      className={cn(
                        "transition-all duration-200",
                        activeStep === index && "ring-2 ring-primary",
                        step.critical && "border-red-200 bg-red-50/50"
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                              step.critical ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                            )}>
                              {step.step}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{step.title}</h4>
                                {step.critical && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Critical
                                  </Badge>
                                )}
                                {step.duration && (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {step.duration}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {step.description}
                              </p>

                              {/* Medications for this step */}
                              {step.medications && step.medications.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm">Medications:</h5>
                                  {step.medications.map((med, medIndex) => (
                                    <div key={medIndex} className="bg-blue-50 p-3 rounded-md">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Zap className="h-3 w-3 text-blue-600" />
                                        <span className="font-semibold text-sm">{med.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {med.route}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-blue-800">{med.dose}</p>
                                      {med.notes && (
                                        <p className="text-xs text-blue-600 mt-1">{med.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={activeStep === index ? "default" : "outline"}
                            onClick={() => setActiveStep(activeStep === index ? -1 : index)}
                          >
                            {activeStep === index ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              `Step ${step.step}`
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Reference Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Medications Reference */}
                {Object.keys(currentProtocol.medications).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Key Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(currentProtocol.medications).map(([drug, dose]) => (
                        <div key={drug} className="flex justify-between items-start">
                          <span className="font-medium capitalize">{drug}:</span>
                          <span className="text-sm text-muted-foreground text-right">{dose}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Vital Signs Reference */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Normal Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Heart Rate:</span>
                      <span className="text-sm text-muted-foreground">{currentProtocol.vitalSigns.heartRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Respiratory Rate:</span>
                      <span className="text-sm text-muted-foreground">{currentProtocol.vitalSigns.respiratoryRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Blood Pressure:</span>
                      <span className="text-sm text-muted-foreground">{currentProtocol.vitalSigns.bloodPressure}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Disclaimer */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> These protocols are for reference only. Always follow your institution's 
                  specific guidelines and current AHA/AAP recommendations. Regular training and certification required.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}