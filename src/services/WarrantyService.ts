export interface WarrantyRule {
  partName: string;
  typicalWarranty: string;
  redliningRule: string;
  warrantyPeriodMonths?: number;
  warrantyMileage?: number;
  isLifetime?: boolean;
  checkReplacementDate?: boolean;
  checkMileage?: boolean;
}

export interface WarrantyCheck {
  partName: string;
  isUnderWarranty: boolean;
  warrantyEndDate?: Date;
  warrantyMileageLimit?: number;
  daysRemaining?: number;
  milesRemaining?: number;
  warrantyCoverage: string;
  redlineReason?: string;
  shouldFlag: boolean;
}

export interface VehicleWarrantyStatus {
  vehicleAge: number; // in years
  vehicleYear: number;
  currentMileage: number;
  applicableWarranties: WarrantyCheck[];
  hasActiveWarranties: boolean;
  flaggedItems: WarrantyCheck[];
}

export class WarrantyService {
  private static readonly WARRANTY_RULES: WarrantyRule[] = [
    {
      partName: "Battery (OEM)",
      typicalWarranty: "2-3 years full, some prorated to 5 years",
      redliningRule: "Flag if replaced < 60 months ago",
      warrantyPeriodMonths: 60,
      checkReplacementDate: true
    },
    {
      partName: "Battery (Aftermarket)", 
      typicalWarranty: "2-5 years",
      redliningRule: "Use vendor-specific policy; default to 60 months",
      warrantyPeriodMonths: 60,
      checkReplacementDate: true
    },
    {
      partName: "Alternator",
      typicalWarranty: "12-24 months", 
      redliningRule: "Flag if replaced < 24 months ago",
      warrantyPeriodMonths: 24,
      checkReplacementDate: true
    },
    {
      partName: "Starter Motor",
      typicalWarranty: "12-24 months",
      redliningRule: "Flag if replaced < 24 months ago", 
      warrantyPeriodMonths: 24,
      checkReplacementDate: true
    },
    {
      partName: "Brake Pads",
      typicalWarranty: "Lifetime (aftermarket brands)",
      redliningRule: "Flag if replaced after initial install - lifetime warranty",
      isLifetime: true,
      checkReplacementDate: true
    },
    {
      partName: "Brake Rotors",
      typicalWarranty: "12-24 months",
      redliningRule: "Flag if replaced < 24 months ago",
      warrantyPeriodMonths: 24,
      checkReplacementDate: true
    },
    {
      partName: "Shocks/Struts", 
      typicalWarranty: "Lifetime or 50K miles",
      redliningRule: "Flag if replaced < 50,000 miles or within 5 years",
      warrantyPeriodMonths: 60,
      warrantyMileage: 50000,
      checkReplacementDate: true,
      checkMileage: true
    },
    {
      partName: "Wiper Blades",
      typicalWarranty: "6-12 months",
      redliningRule: "Flag if replaced < 12 months ago", 
      warrantyPeriodMonths: 12,
      checkReplacementDate: true
    },
    {
      partName: "Headlights/Bulbs",
      typicalWarranty: "12 months",
      redliningRule: "Flag if replaced < 12 months ago",
      warrantyPeriodMonths: 12,
      checkReplacementDate: true
    },
    {
      partName: "Radiator",
      typicalWarranty: "12-36 months", 
      redliningRule: "Flag if replaced < 36 months ago",
      warrantyPeriodMonths: 36,
      checkReplacementDate: true
    },
    {
      partName: "HVAC Compressor",
      typicalWarranty: "12-36 months",
      redliningRule: "Flag if replaced < 36 months ago",
      warrantyPeriodMonths: 36, 
      checkReplacementDate: true
    },
    {
      partName: "Fuel Pump",
      typicalWarranty: "12-36 months",
      redliningRule: "Flag if replaced < 36 months ago",
      warrantyPeriodMonths: 36,
      checkReplacementDate: true
    },
    {
      partName: "Drive/Timing Belt",
      typicalWarranty: "60K-100K miles or 5-10 years", 
      redliningRule: "Flag if replaced < 100,000 miles or < 10 years",
      warrantyPeriodMonths: 120, // 10 years
      warrantyMileage: 100000,
      checkReplacementDate: true,
      checkMileage: true
    },
    {
      partName: "Catalytic Converter",
      typicalWarranty: "8 years / 80,000 miles (Federal law)",
      redliningRule: "Flag if replaced < 8 years or < 80,000 miles", 
      warrantyPeriodMonths: 96, // 8 years
      warrantyMileage: 80000,
      checkReplacementDate: true,
      checkMileage: true
    },
    {
      partName: "Transmission (OEM)",
      typicalWarranty: "5 years / 60,000 miles",
      redliningRule: "Flag if replaced < 60 months or < 60,000 miles",
      warrantyPeriodMonths: 60,
      warrantyMileage: 60000,
      checkReplacementDate: true,
      checkMileage: true
    },
    {
      partName: "Transmission (Rebuilt)",
      typicalWarranty: "12-36 months",
      redliningRule: "Flag if replaced < 36 months ago",
      warrantyPeriodMonths: 36,
      checkReplacementDate: true
    }
  ];

  /**
   * Check warranty status for vehicles less than 5 years old
   */
  static checkVehicleWarranty(
    vehicleYear: number,
    currentMileage: number,
    replacementHistory?: { partName: string; replacementDate: Date; replacementMileage?: number }[]
  ): VehicleWarrantyStatus {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    
    const applicableWarranties: WarrantyCheck[] = [];
    const flaggedItems: WarrantyCheck[] = [];

    // Check warranties for vehicles less than 5 years old
    if (vehicleAge < 5) {
      for (const rule of this.WARRANTY_RULES) {
        const warrantyCheck = this.evaluateWarrantyRule(
          rule,
          vehicleYear,
          currentMileage,
          replacementHistory?.find(r => r.partName.toLowerCase() === rule.partName.toLowerCase())
        );
        
        applicableWarranties.push(warrantyCheck);
        
        if (warrantyCheck.shouldFlag) {
          flaggedItems.push(warrantyCheck);
        }
      }
    }
    // For vehicles 5+ years old, still return the structure but with empty arrays

    return {
      vehicleAge,
      vehicleYear,
      currentMileage,
      applicableWarranties,
      hasActiveWarranties: applicableWarranties.some(w => w.isUnderWarranty),
      flaggedItems
    };
  }

  private static evaluateWarrantyRule(
    rule: WarrantyRule,
    vehicleYear: number,
    currentMileage: number,
    replacementRecord?: { partName: string; replacementDate: Date; replacementMileage?: number }
  ): WarrantyCheck {
    const now = new Date();
    const vehicleStartDate = new Date(vehicleYear, 0, 1); // January 1st of vehicle year
    
    let warrantyStartDate = vehicleStartDate;
    let warrantyStartMileage = 0;
    
    // If part was replaced, warranty starts from replacement date/mileage
    if (replacementRecord) {
      warrantyStartDate = replacementRecord.replacementDate;
      warrantyStartMileage = replacementRecord.replacementMileage || 0;
    }

    let warrantyEndDate: Date | undefined;
    let warrantyMileageLimit: number | undefined;
    let isUnderWarranty = false;
    let shouldFlag = false;
    let redlineReason: string | undefined;

    // Calculate warranty coverage
    if (rule.isLifetime) {
      // Lifetime warranty
      isUnderWarranty = true;
      if (replacementRecord) {
        shouldFlag = true;
        redlineReason = "Part has lifetime warranty and was previously replaced";
      }
    } else {
      // Time-based warranty
      if (rule.warrantyPeriodMonths) {
        warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + rule.warrantyPeriodMonths);
        
        if (now <= warrantyEndDate) {
          isUnderWarranty = true;
        }
        
        // Check if replacement was within warranty period
        if (replacementRecord && replacementRecord.replacementDate >= warrantyStartDate && replacementRecord.replacementDate <= warrantyEndDate) {
          shouldFlag = true;
          redlineReason = `Part was replaced within ${rule.warrantyPeriodMonths} month warranty period`;
        }
      }
      
      // Mileage-based warranty  
      if (rule.warrantyMileage) {
        warrantyMileageLimit = warrantyStartMileage + rule.warrantyMileage;
        
        if (currentMileage <= warrantyMileageLimit) {
          isUnderWarranty = true;
        }
        
        // Check if replacement was within mileage warranty
        if (replacementRecord && replacementRecord.replacementMileage && 
            replacementRecord.replacementMileage <= warrantyMileageLimit) {
          shouldFlag = true;
          redlineReason = `Part was replaced within ${rule.warrantyMileage} mile warranty limit`;
        }
      }
    }

    // Calculate remaining time/mileage
    const daysRemaining = warrantyEndDate ? Math.max(0, Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : undefined;
    const milesRemaining = warrantyMileageLimit ? Math.max(0, warrantyMileageLimit - currentMileage) : undefined;

    return {
      partName: rule.partName,
      isUnderWarranty,
      warrantyEndDate,
      warrantyMileageLimit,
      daysRemaining,
      milesRemaining,
      warrantyCoverage: rule.typicalWarranty,
      redlineReason,
      shouldFlag
    };
  }

  /**
   * Get warranty rules for display purposes
   */
  static getWarrantyRules(): WarrantyRule[] {
    return [...this.WARRANTY_RULES];
  }

  /**
   * Format warranty coverage display
   */
  static formatWarrantyCoverage(warrantyCheck: WarrantyCheck): string {
    if (warrantyCheck.isUnderWarranty) {
      const parts = [];
      
      if (warrantyCheck.daysRemaining) {
        parts.push(`${warrantyCheck.daysRemaining} days remaining`);
      }
      
      if (warrantyCheck.milesRemaining) {
        parts.push(`${warrantyCheck.milesRemaining.toLocaleString()} miles remaining`);
      }
      
      return parts.length > 0 ? parts.join(' / ') : 'Active';
    }
    
    return 'Expired';
  }
}