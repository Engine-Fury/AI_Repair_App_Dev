import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, DollarSign, Calendar } from "lucide-react";
import { VehicleCheck, VehicleCheckService } from "@/services/VehicleCheckService";

interface VehicleChecksProps {
  vehicleCheck: VehicleCheck | null;
  isLoading: boolean;
  error?: string;
}

export const VehicleChecks: React.FC<VehicleChecksProps> = ({ 
  vehicleCheck, 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border-2 border-orange-600 mb-6">
        <div className="bg-orange-600 text-white p-4">
          <h2 className="text-xl font-bold">🔍 VEHICLE CHECKS</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-orange-600 mb-6">
        <div className="bg-orange-600 text-white p-4">
          <h2 className="text-xl font-bold">🔍 VEHICLE CHECKS</h2>
        </div>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to perform vehicle checks: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!vehicleCheck) {
    return (
      <div className="bg-white border-2 border-orange-600 mb-6">
        <div className="bg-orange-600 text-white p-4">
          <h2 className="text-xl font-bold">🔍 VEHICLE CHECKS</h2>
        </div>
        <div className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No vehicle number found in PO. Vehicle checks cannot be performed.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getCostThresholdIcon = () => {
    return vehicleCheck.exceedsCapCostThreshold ? (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    );
  };

  const getReplacementIcon = () => {
    return vehicleCheck.scheduledForReplacement ? (
      <AlertTriangle className="h-5 w-5 text-orange-600" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    );
  };

  return (
    <div className="bg-white border-2 border-orange-600 mb-6">
      <div className="bg-orange-600 text-white p-4">
        <h2 className="text-xl font-bold">🔍 VEHICLE CHECKS</h2>
        <p className="text-orange-100">Vehicle #{vehicleCheck.vehicleNumber}</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Vehicle Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-bold text-gray-600">VEHICLE</label>
            <div className="text-sm text-gray-800">
              {vehicleCheck.vehicleDetails.year} {vehicleCheck.vehicleDetails.make} {vehicleCheck.vehicleDetails.model}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600">CAP COST</label>
            <div className="text-sm text-gray-800">
              {VehicleCheckService.formatCurrency(vehicleCheck.capCost)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600">MILEAGE</label>
            <div className="text-sm text-gray-800">
              {vehicleCheck.vehicleDetails.mileage.toLocaleString()} miles
            </div>
          </div>
        </div>

        {/* Check Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Threshold Check */}
          <Card className={`border-2 ${vehicleCheck.exceedsCapCostThreshold ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getCostThresholdIcon()}
                <DollarSign className="h-5 w-5" />
                Cost Threshold Check
              </CardTitle>
              <CardDescription>
                Repair costs vs. 50% cap cost threshold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Life-to-Date Repairs:</span>
                  <span className="font-bold">
                    {VehicleCheckService.formatCurrency(vehicleCheck.currentRepairs)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Percentage of Cap Cost:</span>
                  <Badge variant={vehicleCheck.exceedsCapCostThreshold ? "destructive" : "default"}>
                    {VehicleCheckService.formatPercentage(vehicleCheck.repairPercentage)}
                  </Badge>
                </div>
                {vehicleCheck.exceedsCapCostThreshold && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>⚠️ FLAG:</strong> Repair costs exceed 50% of cap cost threshold
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Replacement Schedule Check */}
          <Card className={`border-2 ${vehicleCheck.scheduledForReplacement ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getReplacementIcon()}
                <Calendar className="h-5 w-5" />
                Replacement Schedule
              </CardTitle>
              <CardDescription>
                Scheduled replacement within next year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Assigned Cycle:</span>
                  <Badge variant={vehicleCheck.scheduledForReplacement ? "secondary" : "default"}>
                    {vehicleCheck.assignedCycle || 'Not Assigned'}
                  </Badge>
                </div>
                {vehicleCheck.scheduledForReplacement && (
                  <Alert className="mt-3 border-orange-500 bg-orange-50">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>📅 NOTICE:</strong> Vehicle scheduled for replacement in cycle {vehicleCheck.assignedCycle}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Alert */}
        {(vehicleCheck.exceedsCapCostThreshold || vehicleCheck.scheduledForReplacement) && (
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ ATTENTION REQUIRED:</strong> This vehicle has one or more flags that require review before approving additional repair costs.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};