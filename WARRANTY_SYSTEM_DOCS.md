# Warranty Check System

## Overview
This warranty check system is designed to flag potential warranty coverage for vehicles less than 5 years old, helping prevent unnecessary repair costs when parts may still be under warranty.

## System Features

### 1. Age-Based Activation
- **Trigger**: Only activates for vehicles less than 5 years old
- **Rationale**: Older vehicles are unlikely to have significant warranty coverage
- **Integration**: Automatically checks vehicle year against current date

### 2. Comprehensive Part Coverage
The system includes warranty rules for 16 common automotive parts:

| Part Name | Warranty Period | Redlining Rule |
|-----------|----------------|----------------|
| Battery (OEM) | 2-3 years full, some prorated to 5 years | Flag if replaced < 60 months ago |
| Battery (Aftermarket) | 2-5 years | Use vendor-specific policy; default to 60 months |
| Alternator | 12-24 months | Flag if replaced < 24 months ago |
| Starter Motor | 12-24 months | Flag if replaced < 24 months ago |
| Brake Pads | Lifetime (aftermarket brands) | Flag if replaced after initial install |
| Brake Rotors | 12-24 months | Flag if replaced < 24 months ago |
| Shocks/Struts | Lifetime or 50K miles | Flag if replaced < 50,000 miles or within 5 years |
| Wiper Blades | 6-12 months | Flag if replaced < 12 months ago |
| Headlights/Bulbs | 12 months | Flag if replaced < 12 months ago |
| Radiator | 12-36 months | Flag if replaced < 36 months ago |
| HVAC Compressor | 12-36 months | Flag if replaced < 36 months ago |
| Fuel Pump | 12-36 months | Flag if replaced < 36 months ago |
| Drive/Timing Belt | 60K-100K miles or 5-10 years | Flag if replaced < 100,000 miles or < 10 years |
| Catalytic Converter | 8 years / 80,000 miles (Federal law) | Flag if replaced < 8 years or < 80,000 miles |
| Transmission (OEM) | 5 years / 60,000 miles | Flag if replaced < 60 months or < 60,000 miles |
| Transmission (Rebuilt) | 12-36 months | Flag if replaced < 36 months ago |

### 3. Dual-Criteria Checking
The system evaluates warranty coverage based on:
- **Time-based**: Days/months since purchase or replacement
- **Mileage-based**: Current vehicle mileage vs. warranty limits
- **Lifetime warranties**: Special handling for parts with lifetime coverage

### 4. Integration Points

#### VehicleCheckService Integration
```typescript
// Automatic warranty checking for vehicles < 5 years old
if (vehicleAge < 5) {
  result.data.warrantyStatus = WarrantyService.checkVehicleWarranty(
    result.data.vehicleDetails.year,
    result.data.vehicleDetails.mileage
    // TODO: Add replacement history from maintenance records
  );
}
```

#### VehicleChecks Component Display
- **Warranty Summary**: Shows active warranties, flagged items, total coverage
- **Flagged Items**: Highlights parts that may still be under warranty
- **Active Coverage**: Lists currently covered parts with remaining time/mileage
- **Alert Integration**: Includes warranty flags in main attention alerts

## Usage Scenarios

### Scenario 1: New Vehicle (2-3 years old)
- **Result**: Most parts show active warranty coverage
- **Action**: Check manufacturer warranties before approving repairs
- **Benefit**: Significant cost savings on covered repairs

### Scenario 2: Replacement History Available
- **Result**: System flags recently replaced parts still under warranty
- **Action**: Verify warranty claims before authorizing duplicate repairs
- **Benefit**: Prevents duplicate charges for warranty-covered work

### Scenario 3: Federal Emissions Warranty
- **Result**: Flags catalytic converter within 8 years/80,000 miles
- **Action**: Check federal emissions warranty coverage
- **Benefit**: Ensures compliance with federal warranty requirements

## Implementation Status

### ✅ Completed
- [x] WarrantyService.ts - Core warranty logic
- [x] VehicleCheckService.ts - Integration with vehicle checks
- [x] VehicleChecks.tsx - UI display components
- [x] WarrantyDemo.tsx - Testing interface
- [x] Test scenarios and validation

### 🔄 Future Enhancements
- [ ] Integration with maintenance history database
- [ ] Vendor-specific warranty rule customization
- [ ] Real-time warranty API integration
- [ ] Automated warranty claim initiation
- [ ] Historical warranty savings tracking

## Testing

The system includes comprehensive testing through:
1. **WarrantyDemo Component**: Interactive testing in Settings page
2. **Test Script**: Automated scenario validation
3. **Mock Data**: Various vehicle ages and mileage scenarios

### Example Test Results
```
🚗 2022 Vehicle (3 years old, 45,000 miles):
- Active Warranties: 4 parts
- Flagged Items: 0 (no replacement history)

🚗 2020 Vehicle (5+ years old):
- Warranty Check: DISABLED (vehicle too old)

🚗 With Replacement History:
- Flagged: Battery (OEM) - replaced within warranty period
- Flagged: Brake Pads - lifetime warranty violation
```

## Benefits

1. **Cost Savings**: Prevents unnecessary repair costs
2. **Compliance**: Ensures federal warranty compliance
3. **Accuracy**: Reduces human error in warranty checking
4. **Efficiency**: Automated flagging saves review time
5. **Documentation**: Clear audit trail for warranty decisions

## Configuration

The warranty rules are easily configurable through the `WarrantyService.WARRANTY_RULES` array, allowing for:
- Custom warranty periods
- Vendor-specific rules
- Regional compliance requirements
- Fleet-specific policies