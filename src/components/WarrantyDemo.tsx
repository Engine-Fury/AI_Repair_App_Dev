import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WarrantyService, VehicleWarrantyStatus } from "@/services/WarrantyService";

export const WarrantyDemo: React.FC = () => {
  const [vehicleYear, setVehicleYear] = useState<number>(2021);
  const [currentMileage, setCurrentMileage] = useState<number>(45000);
  const [warrantyStatus, setWarrantyStatus] = useState<VehicleWarrantyStatus | null>(null);

  const handleCheckWarranty = () => {
    const status = WarrantyService.checkVehicleWarranty(vehicleYear, currentMileage);
    setWarrantyStatus(status);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Warranty Check Demo
          </CardTitle>
          <CardDescription>
            Test the warranty checking system for vehicles less than 5 years old
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleYear">Vehicle Year</Label>
              <Input
                id="vehicleYear"
                type="number"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(parseInt(e.target.value))}
                min={currentYear - 10}
                max={currentYear + 1}
              />
            </div>
            <div>
              <Label htmlFor="currentMileage">Current Mileage</Label>
              <Input
                id="currentMileage"
                type="number"
                value={currentMileage}
                onChange={(e) => setCurrentMileage(parseInt(e.target.value))}
                min={0}
                max={500000}
              />
            </div>
          </div>
          
          <Button onClick={handleCheckWarranty} className="w-full">
            Check Warranty Status
          </Button>
        </CardContent>
      </Card>

      {warrantyStatus && (
        <div className="space-y-4">
          {/* Vehicle Age Check */}
          <Alert className={warrantyStatus.vehicleAge < 5 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Vehicle Age:</strong> {warrantyStatus.vehicleAge} year{warrantyStatus.vehicleAge !== 1 ? 's' : ''} old
              {warrantyStatus.vehicleAge >= 5 && (
                <div className="mt-2 text-orange-800">
                  <strong>Note:</strong> Warranty checks only apply to vehicles less than 5 years old.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {warrantyStatus.vehicleAge < 5 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {warrantyStatus.applicableWarranties.filter(w => w.isUnderWarranty).length}
                    </div>
                    <div className="text-sm text-blue-700">Active Warranties</div>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-900">
                      {warrantyStatus.flaggedItems.length}
                    </div>
                    <div className="text-sm text-orange-700">Flagged Items</div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {warrantyStatus.applicableWarranties.length}
                    </div>
                    <div className="text-sm text-gray-700">Total Coverage</div>
                  </CardContent>
                </Card>
              </div>

              {/* Warranty Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Warranty Coverage Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {warrantyStatus.applicableWarranties.map((warranty, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          warranty.shouldFlag 
                            ? 'border-red-200 bg-red-50' 
                            : warranty.isUnderWarranty 
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{warranty.partName}</span>
                          <div className="flex gap-2">
                            {warranty.shouldFlag && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                FLAGGED
                              </Badge>
                            )}
                            {warranty.isUnderWarranty && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                COVERED
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Coverage:</strong> {warranty.warrantyCoverage}
                        </div>
                        
                        {warranty.isUnderWarranty && (
                          <div className="text-sm text-green-700">
                            <strong>Status:</strong> {WarrantyService.formatWarrantyCoverage(warranty)}
                          </div>
                        )}
                        
                        {warranty.shouldFlag && warranty.redlineReason && (
                          <div className="text-sm text-red-700 mt-2">
                            <strong>Flag Reason:</strong> {warranty.redlineReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};