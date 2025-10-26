export interface VehicleCheck {
  vehicleNumber: string;
  capCost: number;
  currentRepairs: number;
  repairPercentage: number;
  exceedsCapCostThreshold: boolean;
  assignedCycle: string;
  scheduledForReplacement: boolean;
  replacementJustification: string;
  vehicleDetails: {
    vin: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    vehicleStatus: string;
  };
}

export interface VehicleCheckResult {
  success: boolean;
  data?: VehicleCheck;
  error?: string;
}

export class VehicleCheckService {
  private static readonly API_BASE = 'http://localhost:3001/api/vehicle';

  static async checkVehicle(vehicleNumber: string, currentPOAmount: number = 0): Promise<VehicleCheckResult> {
    try {
      console.log(`🔍 Checking vehicle ${vehicleNumber} with PO amount $${currentPOAmount}`);
      
      const response = await fetch(`${this.API_BASE}/checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleNumber,
          currentPOAmount
        })
      });

      const result = await response.json() as VehicleCheckResult;
      
      if (response.ok) {
        console.log(`✅ Vehicle check successful for ${vehicleNumber}`);
        return result;
      } else {
        console.error(`❌ Vehicle check failed for ${vehicleNumber}:`, result.error);
        return {
          success: false,
          error: result.error || `Vehicle check failed with status ${response.status}`
        };
      }
      
    } catch (error) {
      console.error('❌ Vehicle check service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vehicle check failed'
      };
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}