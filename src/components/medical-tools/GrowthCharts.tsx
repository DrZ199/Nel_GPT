"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Ruler, 
  Weight, 
  User, 
  AlertTriangle, 
  Info,
  Baby,
  Users,
  Calculator,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GrowthData {
  age: number; // in months
  percentiles: {
    p3: number;
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p97: number;
  };
}

// Simplified WHO/CDC growth chart data (sample - in production would use complete datasets)
const HEIGHT_BOYS: GrowthData[] = [
  { age: 0, percentiles: { p3: 46.1, p5: 46.8, p10: 47.8, p25: 49.0, p50: 50.0, p75: 51.0, p90: 52.0, p95: 52.7, p97: 53.4 } },
  { age: 3, percentiles: { p3: 55.3, p5: 56.2, p10: 57.3, p25: 58.7, p50: 60.0, p75: 61.3, p90: 62.7, p95: 63.8, p97: 64.7 } },
  { age: 6, percentiles: { p3: 61.5, p5: 62.4, p10: 63.6, p25: 65.1, p50: 66.8, p75: 68.4, p90: 70.0, p95: 71.1, p97: 72.0 } },
  { age: 12, percentiles: { p3: 71.0, p5: 72.0, p10: 73.4, p25: 75.2, p50: 77.0, p75: 78.8, p90: 80.6, p95: 81.9, p97: 82.9 } },
  { age: 24, percentiles: { p3: 81.7, p5: 82.9, p10: 84.4, p25: 86.4, p50: 88.4, p75: 90.4, p90: 92.4, p95: 93.9, p97: 95.1 } },
  { age: 36, percentiles: { p3: 89.0, p5: 90.3, p10: 92.1, p25: 94.4, p50: 96.7, p75: 99.0, p90: 101.3, p95: 103.0, p97: 104.5 } }
];

const HEIGHT_GIRLS: GrowthData[] = [
  { age: 0, percentiles: { p3: 45.4, p5: 46.0, p10: 47.0, p25: 48.2, p50: 49.1, p75: 50.0, p90: 50.9, p95: 51.5, p97: 52.0 } },
  { age: 3, percentiles: { p3: 54.2, p5: 55.1, p10: 56.2, p25: 57.6, p50: 59.0, p75: 60.4, p90: 61.8, p95: 62.9, p97: 63.8 } },
  { age: 6, percentiles: { p3: 60.1, p5: 61.0, p10: 62.2, p25: 63.7, p50: 65.3, p75: 67.0, p90: 68.6, p95: 69.8, p97: 70.8 } },
  { age: 12, percentiles: { p3: 68.9, p5: 69.9, p10: 71.4, p25: 73.2, p50: 75.0, p75: 76.8, p90: 78.6, p95: 80.0, p97: 81.0 } },
  { age: 24, percentiles: { p3: 79.3, p5: 80.5, p10: 82.0, p25: 84.0, p50: 86.0, p75: 88.0, p90: 90.0, p95: 91.5, p97: 92.7 } },
  { age: 36, percentiles: { p3: 87.0, p5: 88.3, p10: 90.0, p25: 92.4, p50: 94.8, p75: 97.2, p90: 99.6, p95: 101.3, p97: 102.7 } }
];

const WEIGHT_BOYS: GrowthData[] = [
  { age: 0, percentiles: { p3: 2.5, p5: 2.6, p10: 2.9, p25: 3.2, p50: 3.5, p75: 3.8, p90: 4.1, p95: 4.3, p97: 4.5 } },
  { age: 3, percentiles: { p3: 4.4, p5: 4.7, p10: 5.1, p25: 5.6, p50: 6.2, p75: 6.8, p90: 7.4, p95: 7.8, p97: 8.2 } },
  { age: 6, percentiles: { p3: 6.4, p5: 6.7, p10: 7.3, p25: 7.9, p50: 8.6, p75: 9.4, p90: 10.2, p95: 10.7, p97: 11.2 } },
  { age: 12, percentiles: { p3: 8.4, p5: 8.8, p10: 9.4, p25: 10.2, p50: 11.1, p75: 12.0, p90: 13.0, p95: 13.7, p97: 14.3 } },
  { age: 24, percentiles: { p3: 10.5, p5: 11.0, p10: 11.8, p25: 12.8, p50: 13.9, p75: 15.2, p90: 16.5, p95: 17.4, p97: 18.1 } },
  { age: 36, percentiles: { p3: 12.1, p5: 12.7, p10: 13.6, p25: 14.8, p50: 16.2, p75: 17.8, p90: 19.6, p95: 20.7, p97: 21.6 } }
];

const WEIGHT_GIRLS: GrowthData[] = [
  { age: 0, percentiles: { p3: 2.4, p5: 2.5, p10: 2.8, p25: 3.0, p50: 3.3, p75: 3.6, p90: 3.9, p95: 4.1, p97: 4.3 } },
  { age: 3, percentiles: { p3: 4.2, p5: 4.5, p10: 4.9, p25: 5.4, p50: 5.9, p75: 6.5, p90: 7.1, p95: 7.5, p97: 7.9 } },
  { age: 6, percentiles: { p3: 5.8, p5: 6.2, p10: 6.7, p25: 7.3, p50: 8.0, p75: 8.8, p90: 9.6, p95: 10.2, p97: 10.7 } },
  { age: 12, percentiles: { p3: 7.7, p5: 8.1, p10: 8.7, p25: 9.5, p50: 10.4, p75: 11.4, p90: 12.5, p95: 13.2, p97: 13.8 } },
  { age: 24, percentiles: { p3: 9.9, p5: 10.4, p10: 11.2, p25: 12.3, p50: 13.5, p75: 14.8, p90: 16.2, p95: 17.2, p97: 18.0 } },
  { age: 36, percentiles: { p3: 11.6, p5: 12.2, p10: 13.1, p25: 14.4, p50: 15.8, p75: 17.4, p90: 19.2, p95: 20.3, p97: 21.3 } }
];

interface GrowthResult {
  percentile: number;
  zScore: number;
  interpretation: string;
  color: string;
  recommendation?: string;
}

export function GrowthCharts() {
  const [age, setAge] = useState<string>("");
  const [ageUnit, setAgeUnit] = useState<"months" | "years">("months");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "inches">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  const ageInMonths = useMemo(() => {
    const numAge = parseFloat(age);
    if (isNaN(numAge)) return 0;
    return ageUnit === "years" ? numAge * 12 : numAge;
  }, [age, ageUnit]);

  const heightInCm = useMemo(() => {
    const numHeight = parseFloat(height);
    if (isNaN(numHeight)) return 0;
    return heightUnit === "inches" ? numHeight * 2.54 : numHeight;
  }, [height, heightUnit]);

  const weightInKg = useMemo(() => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return 0;
    return weightUnit === "lbs" ? numWeight * 0.453592 : numWeight;
  }, [weight, weightUnit]);

  const interpolatePercentile = (data: GrowthData[], ageMonths: number, value: number): GrowthResult => {
    // Find closest age data points
    let lowerData = data[0];
    let upperData = data[data.length - 1];

    for (let i = 0; i < data.length - 1; i++) {
      if (ageMonths >= data[i].age && ageMonths <= data[i + 1].age) {
        lowerData = data[i];
        upperData = data[i + 1];
        break;
      }
    }

    // Interpolate percentiles for exact age
    const ageRatio = (ageMonths - lowerData.age) / (upperData.age - lowerData.age);
    const percentiles = Object.keys(lowerData.percentiles).reduce((acc, key) => {
      const k = key as keyof typeof lowerData.percentiles;
      acc[k] = lowerData.percentiles[k] + (upperData.percentiles[k] - lowerData.percentiles[k]) * ageRatio;
      return acc;
    }, {} as typeof lowerData.percentiles);

    // Find which percentile the value falls into
    let percentile = 0;
    if (value <= percentiles.p3) percentile = 3;
    else if (value <= percentiles.p5) percentile = 5;
    else if (value <= percentiles.p10) percentile = 10;
    else if (value <= percentiles.p25) percentile = 25;
    else if (value <= percentiles.p50) percentile = 50;
    else if (value <= percentiles.p75) percentile = 75;
    else if (value <= percentiles.p90) percentile = 90;
    else if (value <= percentiles.p95) percentile = 95;
    else if (value <= percentiles.p97) percentile = 97;
    else percentile = 99;

    // Calculate approximate z-score (simplified)
    const mean = percentiles.p50;
    const sd = (percentiles.p90 - mean) / 1.28; // Approximate SD using 90th percentile
    const zScore = Math.round(((value - mean) / sd) * 100) / 100;

    // Determine interpretation and color
    let interpretation = "";
    let color = "";
    let recommendation = "";

    if (percentile < 3) {
      interpretation = "Below 3rd percentile - Significantly below average";
      color = "text-red-600";
      recommendation = "Consider nutritional assessment and further evaluation";
    } else if (percentile < 10) {
      interpretation = "3rd-10th percentile - Below average";
      color = "text-orange-600";
      recommendation = "Monitor growth trend, consider evaluation if crossing percentiles";
    } else if (percentile <= 90) {
      interpretation = "10th-90th percentile - Normal range";
      color = "text-green-600";
      recommendation = "Continue routine growth monitoring";
    } else if (percentile <= 97) {
      interpretation = "90th-97th percentile - Above average";
      color = "text-blue-600";
      recommendation = "Monitor for excessive growth velocity if concerning";
    } else {
      interpretation = "Above 97th percentile - Significantly above average";
      color = "text-purple-600";
      recommendation = "Consider evaluation for underlying conditions";
    }

    return {
      percentile,
      zScore,
      interpretation,
      color,
      recommendation
    };
  };

  const heightResult = useMemo(() => {
    if (!gender || !ageInMonths || !heightInCm) return null;
    const data = gender === "male" ? HEIGHT_BOYS : HEIGHT_GIRLS;
    return interpolatePercentile(data, ageInMonths, heightInCm);
  }, [gender, ageInMonths, heightInCm]);

  const weightResult = useMemo(() => {
    if (!gender || !ageInMonths || !weightInKg) return null;
    const data = gender === "male" ? WEIGHT_BOYS : WEIGHT_GIRLS;
    return interpolatePercentile(data, ageInMonths, weightInKg);
  }, [gender, ageInMonths, weightInKg]);

  const bmiResult = useMemo(() => {
    if (!heightInCm || !weightInKg) return null;
    const heightInMeters = heightInCm / 100;
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    
    // BMI interpretation for children (simplified)
    let interpretation = "";
    let color = "";
    
    if (bmi < 5) {
      interpretation = "Underweight";
      color = "text-red-600";
    } else if (bmi < 25) {
      interpretation = "Normal weight";
      color = "text-green-600";
    } else if (bmi < 30) {
      interpretation = "Overweight";
      color = "text-orange-600";
    } else {
      interpretation = "Obese";
      color = "text-red-600";
    }

    return {
      bmi: Math.round(bmi * 10) / 10,
      interpretation,
      color
    };
  }, [heightInCm, weightInKg]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Pediatric Growth Charts</CardTitle>
        </div>
        <CardDescription>
          WHO/CDC growth chart percentiles for height, weight, and BMI assessment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Patient Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <div className="flex gap-2">
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="flex-1"
                  step="0.25"
                />
                <Select value={ageUnit} onValueChange={(value: "months" | "years") => setAgeUnit(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">mo</SelectItem>
                    <SelectItem value="years">yr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ageInMonths > 0 && ageUnit === "years" && (
                <p className="text-sm text-muted-foreground">
                  {ageInMonths} months
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(value: "male" | "female") => setGender(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height"
                  className="flex-1"
                />
                <Select value={heightUnit} onValueChange={(value: "cm" | "inches") => setHeightUnit(value)}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="inches">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {heightInCm > 0 && heightUnit === "inches" && (
                <p className="text-sm text-muted-foreground">
                  {heightInCm.toFixed(1)} cm
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight"
                  className="flex-1"
                />
                <Select value={weightUnit} onValueChange={(value: "kg" | "lbs") => setWeightUnit(value)}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {weightInKg > 0 && weightUnit === "lbs" && (
                <p className="text-sm text-muted-foreground">
                  {weightInKg.toFixed(1)} kg
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {(heightResult || weightResult || bmiResult) && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Growth Assessment
              </h3>
              
              <div className="grid gap-4">
                {/* Height Percentile */}
                {heightResult && (
                  <Card className="bg-blue-50/50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Height for Age</span>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {heightResult.percentile}th percentile
                        </Badge>
                      </div>
                      
                      <Progress value={heightResult.percentile} className="mb-3" />
                      
                      <div className="space-y-2">
                        <p className={cn("text-sm font-medium", heightResult.color)}>
                          {heightResult.interpretation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Z-Score: {heightResult.zScore} | Height: {heightInCm.toFixed(1)} cm
                        </p>
                        {heightResult.recommendation && (
                          <p className="text-xs bg-blue-100 p-2 rounded text-blue-800">
                            {heightResult.recommendation}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weight Percentile */}
                {weightResult && (
                  <Card className="bg-green-50/50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">Weight for Age</span>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {weightResult.percentile}th percentile
                        </Badge>
                      </div>
                      
                      <Progress value={weightResult.percentile} className="mb-3" />
                      
                      <div className="space-y-2">
                        <p className={cn("text-sm font-medium", weightResult.color)}>
                          {weightResult.interpretation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Z-Score: {weightResult.zScore} | Weight: {weightInKg.toFixed(1)} kg
                        </p>
                        {weightResult.recommendation && (
                          <p className="text-xs bg-green-100 p-2 rounded text-green-800">
                            {weightResult.recommendation}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BMI */}
                {bmiResult && (
                  <Card className="bg-purple-50/50 border-purple-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">Body Mass Index</span>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {bmiResult.bmi} kg/m²
                        </Badge>
                      </div>
                      
                      <p className={cn("text-sm font-medium", bmiResult.color)}>
                        {bmiResult.interpretation}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Age-specific Alerts */}
            {ageInMonths > 0 && (
              <div className="space-y-3">
                {ageInMonths < 6 && (
                  <Alert>
                    <Baby className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Infant Growth:</strong> Rapid growth expected. Weight should double by 6 months, 
                      triple by 12 months. Monitor feeding patterns and developmental milestones.
                    </AlertDescription>
                  </Alert>
                )}

                {ageInMonths >= 24 && ageInMonths < 60 && (
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Toddler Growth:</strong> Growth velocity decreases. Average weight gain 4-6 lbs/year, 
                      height 2-3 inches/year. Appetite may be variable.
                    </AlertDescription>
                  </Alert>
                )}

                {((heightResult?.percentile ?? 50) < 3 || (weightResult?.percentile ?? 50) < 3) && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Growth Concern:</strong> Measurements below 3rd percentile warrant further evaluation. 
                      Consider nutritional assessment, medical history review, and possible referral to pediatric endocrinology.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}

        {/* Clinical Notes */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            Clinical Notes
          </h4>
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <p>• Growth charts based on WHO (0-2 years) and CDC (2-20 years) standards</p>
            <p>• Plot growth points over time to assess growth velocity and trends</p>
            <p>• Consider parental heights, genetic potential, and underlying conditions</p>
            <p>• Crossing two or more percentile lines may indicate underlying pathology</p>
            <p>• This calculator provides estimates - clinical correlation always required</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}