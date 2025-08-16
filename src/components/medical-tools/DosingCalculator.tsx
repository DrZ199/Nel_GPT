"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calculator, AlertTriangle, CheckCircle, BookOpen, Weight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrugDose {
  name: string;
  category: string;
  indications: string[];
  dosing: {
    mg_kg_dose?: number;
    mg_kg_day?: number;
    max_dose?: number;
    frequency: string;
    route: string;
    notes?: string;
  };
  contraindications?: string[];
  warnings?: string[];
}

// Comprehensive pediatric drug database based on Nelson Textbook guidelines
const PEDIATRIC_DRUGS: DrugDose[] = [
  {
    name: "Amoxicillin",
    category: "Antibiotic",
    indications: ["Acute otitis media", "Sinusitis", "Streptococcal pharyngitis", "UTI"],
    dosing: {
      mg_kg_day: 40,
      max_dose: 1000,
      frequency: "every 8 hours",
      route: "PO",
      notes: "High dose: 80-90 mg/kg/day for severe infections"
    },
    warnings: ["Adjust dose in renal impairment"]
  },
  {
    name: "Amoxicillin-Clavulanate",
    category: "Antibiotic",
    indications: ["Acute otitis media (treatment failure)", "Pneumonia", "Skin infections"],
    dosing: {
      mg_kg_day: 45,
      max_dose: 875,
      frequency: "every 12 hours",
      route: "PO",
      notes: "Based on amoxicillin component"
    }
  },
  {
    name: "Azithromycin",
    category: "Antibiotic",
    indications: ["Atypical pneumonia", "Pertussis", "Streptococcal pharyngitis"],
    dosing: {
      mg_kg_dose: 10,
      max_dose: 500,
      frequency: "daily x 3 days",
      route: "PO",
      notes: "Day 1: 10 mg/kg, Days 2-5: 5 mg/kg"
    }
  },
  {
    name: "Acetaminophen",
    category: "Analgesic/Antipyretic",
    indications: ["Fever", "Pain management"],
    dosing: {
      mg_kg_dose: 15,
      max_dose: 1000,
      frequency: "every 6 hours",
      route: "PO/PR",
      notes: "Maximum 75 mg/kg/day"
    },
    warnings: ["Hepatotoxicity risk with overdose"]
  },
  {
    name: "Ibuprofen",
    category: "NSAID",
    indications: ["Fever", "Pain management", "Anti-inflammatory"],
    dosing: {
      mg_kg_dose: 10,
      max_dose: 600,
      frequency: "every 6-8 hours",
      route: "PO",
      notes: "Maximum 40 mg/kg/day, >6 months old"
    },
    contraindications: ["<6 months", "Dehydration", "Renal impairment"],
    warnings: ["GI bleeding risk", "Nephrotoxicity"]
  },
  {
    name: "Prednisone",
    category: "Corticosteroid",
    indications: ["Asthma exacerbation", "Allergic reactions", "Inflammatory conditions"],
    dosing: {
      mg_kg_day: 2,
      max_dose: 60,
      frequency: "daily or divided BID",
      route: "PO",
      notes: "Typical course 3-5 days for asthma"
    },
    warnings: ["Immunosuppression", "Growth suppression with prolonged use"]
  },
  {
    name: "Albuterol",
    category: "Bronchodilator",
    indications: ["Asthma", "Bronchospasm"],
    dosing: {
      mg_kg_dose: 0.15,
      max_dose: 5,
      frequency: "every 4-6 hours PRN",
      route: "Nebulizer",
      notes: "MDI: 2-4 puffs every 4-6 hours"
    }
  },
  {
    name: "Ceftriaxone",
    category: "Antibiotic",
    indications: ["Meningitis", "Serious bacterial infections", "Pneumonia"],
    dosing: {
      mg_kg_day: 50,
      max_dose: 2000,
      frequency: "daily",
      route: "IV/IM",
      notes: "Meningitis: 100 mg/kg/day divided BID"
    },
    contraindications: ["Hyperbilirubinemia in neonates"]
  }
];

export function DosingCalculator() {
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [age, setAge] = useState<string>("");
  const [selectedDrug, setSelectedDrug] = useState<DrugDose | null>(null);
  const [indication, setIndication] = useState<string>("");

  const weightInKg = useMemo(() => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return 0;
    return weightUnit === "lb" ? numWeight * 0.453592 : numWeight;
  }, [weight, weightUnit]);

  const calculateDose = useCallback((drug: DrugDose) => {
    if (!weightInKg || weightInKg <= 0) return null;

    const dosing = drug.dosing;
    let calculatedDose = 0;
    let frequency = dosing.frequency;
    let route = dosing.route;

    if (dosing.mg_kg_dose) {
      calculatedDose = dosing.mg_kg_dose * weightInKg;
    } else if (dosing.mg_kg_day) {
      calculatedDose = dosing.mg_kg_day * weightInKg;
    }

    // Apply maximum dose if specified
    if (dosing.max_dose && calculatedDose > dosing.max_dose) {
      calculatedDose = dosing.max_dose;
    }

    return {
      dose: Math.round(calculatedDose * 100) / 100,
      frequency,
      route,
      notes: dosing.notes,
      maxDoseReached: dosing.max_dose ? calculatedDose >= dosing.max_dose : false
    };
  }, [weightInKg]);

  const doseResult = selectedDrug ? calculateDose(selectedDrug) : null;

  const getAgeGroup = () => {
    const numAge = parseFloat(age);
    if (isNaN(numAge)) return "unknown";
    if (numAge < 0.25) return "neonate";
    if (numAge < 2) return "infant";
    if (numAge < 12) return "child";
    return "adolescent";
  };

  const hasContraindications = () => {
    if (!selectedDrug?.contraindications) return false;
    const ageGroup = getAgeGroup();
    return selectedDrug.contraindications.some(contraindication => 
      contraindication.toLowerCase().includes(ageGroup) ||
      (ageGroup === "infant" && contraindication.includes("<6 months"))
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Pediatric Dosing Calculator</CardTitle>
        </div>
        <CardDescription>
          Evidence-based pediatric drug dosing calculator using Nelson Textbook guidelines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Patient Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Weight className="h-4 w-4" />
            Patient Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="flex-1"
                />
                <Select value={weightUnit} onValueChange={(value: "kg" | "lb") => setWeightUnit(value)}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {weightInKg > 0 && weightUnit === "lb" && (
                <p className="text-sm text-muted-foreground">
                  {weightInKg.toFixed(1)} kg
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter age"
                step="0.25"
              />
              {age && (
                <Badge variant="outline" className="text-xs">
                  {getAgeGroup()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Drug Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Drug Selection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Medication</Label>
              <Select onValueChange={(value) => {
                const drug = PEDIATRIC_DRUGS.find(d => d.name === value);
                setSelectedDrug(drug || null);
                setIndication("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {PEDIATRIC_DRUGS.map((drug) => (
                    <SelectItem key={drug.name} value={drug.name}>
                      <div className="flex items-center gap-2">
                        <span>{drug.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {drug.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDrug && (
              <div className="space-y-2">
                <Label>Indication</Label>
                <Select value={indication} onValueChange={setIndication}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select indication" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDrug.indications.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Dose Calculation Results */}
        {selectedDrug && weightInKg > 0 && doseResult && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Calculated Dose
              </h3>
              
              {/* Safety Alerts */}
              {hasContraindications() && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Contraindication Alert:</strong> This medication may not be appropriate for this age group. 
                    Review contraindications: {selectedDrug.contraindications?.join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              {selectedDrug.warnings && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warnings:</strong> {selectedDrug.warnings.join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              {/* Dose Information */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {doseResult.dose} mg
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dose per administration
                      </div>
                      {doseResult.maxDoseReached && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Max dose reached
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {doseResult.frequency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Frequency
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {doseResult.route}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Route
                      </div>
                    </div>
                  </div>

                  {doseResult.notes && (
                    <div className="mt-4 p-3 bg-background/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Clinical Notes:</p>
                          <p className="text-sm text-muted-foreground">{doseResult.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {indication && (
                    <div className="mt-3">
                      <Badge variant="outline" className="bg-background">
                        Indication: {indication}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Reference */}
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Clinical Reminders</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Always verify patient allergies before prescribing</p>
            <p>• Check for drug interactions with current medications</p>
            <p>• Consider renal/hepatic function for dose adjustments</p>
            <p>• Dosing based on Nelson Textbook of Pediatrics 22nd Edition</p>
            <p>• This calculator is for reference only - clinical judgment required</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}