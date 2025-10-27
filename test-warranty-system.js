// Test file to demonstrate warranty checking functionality

// Mock the WarrantyService class for testing
class WarrantyService {
  static WARRANTY_RULES = [
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
      partName: "Brake Pads",
      typicalWarranty: "Lifetime (aftermarket brands)",
      redliningRule: "Flag if replaced after initial install - lifetime warranty",
      isLifetime: true,
      checkReplacementDate: true
    },
    {
      partName: "Catalytic Converter",
      typicalWarranty: "8 years / 80,000 miles (Federal law)",
      redliningRule: "Flag if replaced < 8 years or < 80,000 miles", 
      warrantyPeriodMonths: 96, // 8 years
      warrantyMileage: 80000,
      checkReplacementDate: true,
      checkMileage: true
    }
  ];

  static checkVehicleWarranty(vehicleYear, currentMileage, replacementHistory = []) {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    
    const applicableWarranties = [];
    const flaggedItems = [];

    if (vehicleAge < 5) {
      for (const rule of this.WARRANTY_RULES) {
        const warrantyCheck = this.evaluateWarrantyRule(
          rule,
          vehicleYear,
          currentMileage,
          replacementHistory.find(r => r.partName.toLowerCase() === rule.partName.toLowerCase())
        );
        
        applicableWarranties.push(warrantyCheck);
        
        if (warrantyCheck.shouldFlag) {
          flaggedItems.push(warrantyCheck);
        }
      }
    }

    return {
      vehicleAge,
      vehicleYear,
      currentMileage,
      applicableWarranties,
      hasActiveWarranties: applicableWarranties.some(w => w.isUnderWarranty),
      flaggedItems
    };
  }

  static evaluateWarrantyRule(rule, vehicleYear, currentMileage, replacementRecord) {
    const now = new Date();
    const vehicleStartDate = new Date(vehicleYear, 0, 1);
    
    let warrantyStartDate = vehicleStartDate;
    let warrantyStartMileage = 0;
    
    if (replacementRecord) {
      warrantyStartDate = replacementRecord.replacementDate;
      warrantyStartMileage = replacementRecord.replacementMileage || 0;
    }

    let warrantyEndDate;
    let warrantyMileageLimit;
    let isUnderWarranty = false;
    let shouldFlag = false;
    let redlineReason;

    if (rule.isLifetime) {
      isUnderWarranty = true;
      if (replacementRecord) {
        shouldFlag = true;
        redlineReason = "Part has lifetime warranty and was previously replaced";
      }
    } else {
      if (rule.warrantyPeriodMonths) {
        warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + rule.warrantyPeriodMonths);
        
        if (now <= warrantyEndDate) {
          isUnderWarranty = true;
        }
        
        if (replacementRecord && replacementRecord.replacementDate >= warrantyStartDate && replacementRecord.replacementDate <= warrantyEndDate) {
          shouldFlag = true;
          redlineReason = `Part was replaced within ${rule.warrantyPeriodMonths} month warranty period`;
        }
      }
      
      if (rule.warrantyMileage) {
        warrantyMileageLimit = warrantyStartMileage + rule.warrantyMileage;
        
        if (currentMileage <= warrantyMileageLimit) {
          isUnderWarranty = true;
        }
        
        if (replacementRecord && replacementRecord.replacementMileage && 
            replacementRecord.replacementMileage <= warrantyMileageLimit) {
          shouldFlag = true;
          redlineReason = `Part was replaced within ${rule.warrantyMileage} mile warranty limit`;
        }
      }
    }

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

  static getWarrantyRules() {
    return [...this.WARRANTY_RULES];
  }

  static formatWarrantyCoverage(warrantyCheck) {
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

// Test scenarios
console.log('=== WARRANTY SYSTEM TESTING ===\n');

// Scenario 1: 2022 Vehicle (3 years old) with 45,000 miles
console.log('🚗 TEST 1: 2022 Vehicle with 45,000 miles');
const test1 = WarrantyService.checkVehicleWarranty(2022, 45000);
console.log(`Vehicle Age: ${test1.vehicleAge} years`);
console.log(`Active Warranties: ${test1.applicableWarranties.filter(w => w.isUnderWarranty).length}`);
console.log(`Flagged Items: ${test1.flaggedItems.length}`);
console.log('Flagged Parts:', test1.flaggedItems.map(f => f.partName));
console.log('');

// Scenario 2: 2020 Vehicle (5 years old) - should not show warranties
console.log('🚗 TEST 2: 2020 Vehicle (5+ years old)');
const test2 = WarrantyService.checkVehicleWarranty(2020, 75000);
console.log(`Vehicle Age: ${test2.vehicleAge} years`);
console.log(`Should show warranties: ${test2.vehicleAge < 5 ? 'YES' : 'NO'}`);
console.log('');

// Scenario 3: 2023 Vehicle (2 years old) with low mileage
console.log('🚗 TEST 3: 2023 Vehicle with 25,000 miles');
const test3 = WarrantyService.checkVehicleWarranty(2023, 25000);
console.log(`Vehicle Age: ${test3.vehicleAge} years`);
console.log(`Active Warranties: ${test3.applicableWarranties.filter(w => w.isUnderWarranty).length}`);

// Show some active warranties
const activeWarranties = test3.applicableWarranties.filter(w => w.isUnderWarranty);
console.log('Active Warranty Examples:');
activeWarranties.slice(0, 3).forEach(w => {
  console.log(`- ${w.partName}: ${WarrantyService.formatWarrantyCoverage(w)}`);
});
console.log('');

// Scenario 4: Show warranty rules
console.log('📋 WARRANTY RULES OVERVIEW:');
const rules = WarrantyService.getWarrantyRules();
console.log(`Total warranty rules: ${rules.length}`);
console.log('');

console.log('Sample Rules:');
rules.slice(0, 5).forEach(rule => {
  console.log(`• ${rule.partName}: ${rule.typicalWarranty}`);
  console.log(`  Rule: ${rule.redliningRule}`);
  console.log('');
});

console.log('=== TESTING COMPLETE ===');

// Example of how to simulate replacement history
console.log('\n🔧 REPLACEMENT HISTORY SIMULATION:');
const replacementHistory = [
  {
    partName: 'Battery (OEM)',
    replacementDate: new Date('2024-06-15'), // 4 months ago
    replacementMileage: 40000
  },
  {
    partName: 'Brake Pads',
    replacementDate: new Date('2024-08-01'), // 2 months ago (lifetime warranty)
    replacementMileage: 42000
  }
];

const test4 = WarrantyService.checkVehicleWarranty(2022, 45000, replacementHistory);
console.log(`Flagged items with replacement history: ${test4.flaggedItems.length}`);
test4.flaggedItems.forEach(item => {
  console.log(`⚠️ ${item.partName}: ${item.redlineReason}`);
});