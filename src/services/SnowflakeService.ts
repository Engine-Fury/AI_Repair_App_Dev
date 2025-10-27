// Browser-compatible SnowflakeService - uses HTTP API instead of direct Snowflake SDK

interface VehicleData {
  vehicleId: string;
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  vehicleNumber?: string;
  capCost: number;
  lifeToDateRepairCost: number;
  scheduledReplacement?: boolean;
  replacementDate?: string;
  tenantId: string;
}

interface RepairCostAnalysis {
  currentRepairCost: number;
  totalLifeToDateCost: number;
  projectedTotalCost: number;
  capCost: number;
  costPercentage: number;
  exceedsThreshold: boolean;
  scheduledForReplacement: boolean;
  replacementWithinYear: boolean;
  recommendations: string[];
  // ABM Calendar data
  replacementCycle?: string;
  replacementTag?: string;
  replacementTagReason?: string;
  replacementCycleReason?: string;
  replacementHalf?: string;
  earliestTriggerDate?: string;
  cycleTriggerType?: string;
}

class SnowflakeServiceClass {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:3002';
  }

  async analyzeRepairCost(identifier: string, tenantId: string, currentPOAmount: number): Promise<RepairCostAnalysis> {
    try {
      console.log(' Analyzing repair cost for vehicle:', { identifier, tenantId, currentPOAmount });

      const response = await fetch(`${this.baseUrl}/api/snowflake/vehicle-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          identifier,
          tenantId,
          currentPOAmount,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Vehicle analysis failed');
      }

      console.log(' Vehicle analysis completed:', result.data);
      return result.data.costAnalysis;

    } catch (error) {
      console.error(' Error analyzing repair cost:', error);
      
      return {
        currentRepairCost: currentPOAmount,
        totalLifeToDateCost: 0,
        projectedTotalCost: currentPOAmount,
        capCost: 50000,
        costPercentage: (currentPOAmount / 50000) * 100,
        exceedsThreshold: (currentPOAmount / 50000) > 0.5,
        scheduledForReplacement: false,
        replacementWithinYear: false,
        recommendations: [
          ' Unable to connect to fleet database',
          'Using estimated values for cost analysis',
          'Contact fleet administrator to verify actual vehicle data'
        ],
        replacementCycle: null,
        replacementTag: null,
        replacementTagReason: null,
        replacementCycleReason: null,
        replacementHalf: null,
        earliestTriggerDate: null,
        cycleTriggerType: null
      };
    }
  }

  async lookupVehicle(identifier: string): Promise<{ success: boolean; data?: VehicleData; error?: string }> {
    try {
      console.log(`🔍 Looking up vehicle: ${identifier}`);

      const response = await fetch(`${this.baseUrl}/api/snowflake/vehicle-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          identifier,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`
        };
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error
      };

    } catch (error) {
      console.error('Error looking up vehicle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getVehicleData(identifier: string, tenantId: string): Promise<VehicleData | null> {
    try {
      console.log(`🔍 Fetching vehicle data for: ${identifier} (Tenant: ${tenantId})`);

      const response = await fetch(`${this.baseUrl}/api/snowflake/vehicle-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          tenantId,
          currentPOAmount: 0 // Just for vehicle lookup
        })
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (!result.success) {
        return null;
      }

      return result.data.vehicleData;

    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      return null;
    }
  }
}

export const SnowflakeService = new SnowflakeServiceClass();
export type { VehicleData, RepairCostAnalysis };

import type { POData } from './POParser';

export function extractVehicleNumber(poData: POData): string | null {
  if (poData?.vehicle?.vehicleNumber) {
    return poData.vehicle.vehicleNumber;
  }
  
  if (poData?.vehicle?.vin) {
    return poData.vehicle.vin;
  }
  
  if (poData?.vehicle?.licensePlate) {
    return poData.vehicle.licensePlate;
  }
  
  if (poData?.poNumber) {
    return poData.poNumber;
  }
  
  return null;
}
