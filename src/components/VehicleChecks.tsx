import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, DollarSign, Calendar, Shield, Clock } from "lucide-react";
import { VehicleCheck, VehicleCheckService } from "@/services/VehicleCheckService";
import { WarrantyService } from "@/services/WarrantyService";

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

        {/* Warranty Checks - Show for all vehicles */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Warranty Coverage Analysis</h3>
            <Badge variant="outline" className="ml-2">
              {new Date().getFullYear() - vehicleCheck.vehicleDetails.year} year{(new Date().getFullYear() - vehicleCheck.vehicleDetails.year) !== 1 ? 's' : ''} old
            </Badge>
          </div>

          {/* Check if vehicle is eligible for warranty checks */}
          {(new Date().getFullYear() - vehicleCheck.vehicleDetails.year) >= 5 ? (
            /* Vehicle not eligible for warranty */
            <Card className="border-2 border-green-500 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                  <Shield className="h-5 w-5 text-green-600" />
                  Vehicle Not Under Warranty Coverage
                </CardTitle>
                <CardDescription className="text-green-700">
                  Warranty checks only apply to vehicles less than 5 years old
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert className="border-green-500 bg-green-100">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>📋 WARRANTY STATUS:</strong> This vehicle is {new Date().getFullYear() - vehicleCheck.vehicleDetails.year} years old and is not eligible for manufacturer warranty coverage. 
                      Standard repair procedures apply without warranty considerations.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-100 rounded-lg border border-green-400">
                    <div>
                      <label className="block text-sm font-bold text-green-700">VEHICLE AGE</label>
                      <div className="text-lg font-bold text-green-900">
                        {new Date().getFullYear() - vehicleCheck.vehicleDetails.year} years
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-green-700">WARRANTY STATUS</label>
                      <div className="text-lg font-bold text-green-900">
                        Not Applicable
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-green-700">COVERAGE</label>
                      <div className="text-lg font-bold text-green-900">
                        None Expected
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Vehicle eligible for warranty - show warranty analysis */
            vehicleCheck.warrantyStatus && (
              <>
                {/* Warranty Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-bold text-blue-800">ACTIVE WARRANTIES</label>
                    <div className="text-lg font-bold text-blue-900">
                      {vehicleCheck.warrantyStatus.applicableWarranties.filter(w => w.isUnderWarranty).length}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-orange-800">FLAGGED ITEMS</label>
                    <div className="text-lg font-bold text-orange-900">
                      {vehicleCheck.warrantyStatus.flaggedItems.length}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600">TOTAL COVERAGE</label>
                    <div className="text-lg font-bold text-gray-800">
                      {vehicleCheck.warrantyStatus.applicableWarranties.length} items
                    </div>
                  </div>
                </div>

                {/* Flagged Warranty Items */}
                {vehicleCheck.warrantyStatus.flaggedItems.length > 0 && (
                  <Card className="border-2 border-red-500 bg-red-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg text-red-800">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Warranty Redline Flags
                      </CardTitle>
                      <CardDescription className="text-red-700">
                        Parts that may still be under warranty coverage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {vehicleCheck.warrantyStatus.flaggedItems.map((item, index) => (
                          <div key={index} className="p-3 bg-white rounded border border-red-200">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-red-900">{item.partName}</span>
                              <Badge variant="destructive" className="text-xs">
                                FLAGGED
                              </Badge>
                            </div>
                            <div className="text-sm text-red-800 mb-1">
                              <strong>Reason:</strong> {item.redlineReason}
                            </div>
                            <div className="text-xs text-red-600">
                              <strong>Coverage:</strong> {item.warrantyCoverage}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Active Warranties */}
                {vehicleCheck.warrantyStatus.hasActiveWarranties && (
                  <Card className="border-2 border-green-500 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                        <Shield className="h-5 w-5 text-green-600" />
                        Active Warranty Coverage
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Parts currently under warranty
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {vehicleCheck.warrantyStatus.applicableWarranties
                          .filter(w => w.isUnderWarranty)
                          .map((item, index) => (
                            <div key={index} className="p-3 bg-white rounded border border-green-200">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-green-900">{item.partName}</span>
                                <Badge variant="default" className="text-xs bg-green-600">
                                  COVERED
                                </Badge>
                              </div>
                              <div className="text-sm text-green-800 mb-1">
                                <strong>Coverage:</strong> {item.warrantyCoverage}
                              </div>
                              <div className="text-xs text-green-600 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {WarrantyService.formatWarrantyCoverage(item)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )
          )}
        </div>

        {/* Summary Alert */}
        {(vehicleCheck.exceedsCapCostThreshold || 
          vehicleCheck.scheduledForReplacement || 
          (vehicleCheck.warrantyStatus && 
           vehicleCheck.warrantyStatus.vehicleAge < 5 && 
           vehicleCheck.warrantyStatus.flaggedItems.length > 0)) && (
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ ATTENTION REQUIRED:</strong> This vehicle has one or more flags that require review before approving additional repair costs.
              {vehicleCheck.warrantyStatus && 
               vehicleCheck.warrantyStatus.vehicleAge < 5 && 
               vehicleCheck.warrantyStatus.flaggedItems.length > 0 && (
                <div className="mt-2 text-sm">
                  <strong>Warranty Alert:</strong> {vehicleCheck.warrantyStatus.flaggedItems.length} part(s) may still be under warranty coverage.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};