export interface LaborStandard {
  Component: string;
  ExpertHoursMin: number | null;
  ExpertHoursMax: number | null;
  VMRSCode: string;
}

export interface LaborAnalysisResult {
  component: string;
  billedHours: number;
  standardMinHours: number;
  standardMaxHours: number;
  variance: number;
  status: 'reasonable' | 'high' | 'excessive';
  vmrsCode: string;
  confidence: number;
  reason: string;
  correction?: string;
  cause?: string;
}

export class LaborHoursService {
  private static laborStandards: LaborStandard[] = [
    {"Component": "Battery Replacement (Standard)", "ExpertHoursMin": 0.5, "ExpertHoursMax": 0.8, "VMRSCode": "32001001"},
    {"Component": "Battery Replacement (Difficult Access)", "ExpertHoursMin": 1.2, "ExpertHoursMax": 1.5, "VMRSCode": "32001001"},
    {"Component": "Battery Bank (Multiple Units)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "32001001"},
    {"Component": "Alternator Replacement", "ExpertHoursMin": 1.2, "ExpertHoursMax": 2.5, "VMRSCode": "32002001"},
    {"Component": "Starter Motor Replacement", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "32003001"},
    {"Component": "Starter Relay", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.5, "VMRSCode": "32003002"},
    {"Component": "Starter Solenoid", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.2, "VMRSCode": "32003003"},
    {"Component": "Generator/Alternator Belt", "ExpertHoursMin": 0.5, "ExpertHoursMax": 0.7, "VMRSCode": "32002002"},
    {"Component": "Serpentine Belt", "ExpertHoursMin": 0.5, "ExpertHoursMax": 0.7, "VMRSCode": "32002003"},
    {"Component": "Battery Cables", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "32001002"},
    {"Component": "Fuse Box/Panel", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "32004001"},
    {"Component": "Main Wiring Harness", "ExpertHoursMin": 3.0, "ExpertHoursMax": 8.0, "VMRSCode": "30003001"},
    {"Component": "ECM/PCM", "ExpertHoursMin": 1.5, "ExpertHoursMax": 3.0, "VMRSCode": "32005001"},
    {"Component": "Ignition Switch", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "32006001"},
    {"Component": "Horn", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.8, "VMRSCode": "32007001"},
    {"Component": "Headlight Bulb", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.5, "VMRSCode": "32008001"},
    {"Component": "Headlight Assembly", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "32008002"},
    {"Component": "Tail Light Assembly", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "32008003"},
    {"Component": "Turn Signal Bulbs", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.5, "VMRSCode": "32008004"},
    {"Component": "Flasher Relay", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.5, "VMRSCode": "32008005"},
    {"Component": "Electrical Diagnosis (Basic)", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "30001005"},
    {"Component": "Electrical Diagnosis (Complex)", "ExpertHoursMin": 2.0, "ExpertHoursMax": 6.0, "VMRSCode": "30001005"},
    {"Component": "Radiator Replacement", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "42001001"},
    {"Component": "Water Pump Replacement", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "42003001"},
    {"Component": "Thermostat", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "42004001"},
    {"Component": "Radiator Hoses (Upper/Lower)", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "42007001"},
    {"Component": "Heater Hoses", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "42007002"},
    {"Component": "Coolant Temperature Sensor", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "42006001"},
    {"Component": "Cooling Fan Motor", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "42005001"},
    {"Component": "Cooling Fan Shroud", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "42005002"},
    {"Component": "Radiator Cap", "ExpertHoursMin": 0.1, "ExpertHoursMax": 0.2, "VMRSCode": "42001002"},
    {"Component": "Expansion Tank", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "42009001"},
    {"Component": "Air Filter", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.5, "VMRSCode": "44001001"},
    {"Component": "Air Intake Hose", "ExpertHoursMin": null, "ExpertHoursMax": null, "VMRSCode": "44001002"},
    {"Component": "Throttle Body", "ExpertHoursMin": 1.5, "ExpertHoursMax": 3.0, "VMRSCode": "44002001"},
    {"Component": "Mass Air Flow Sensor", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "44002002"},
    {"Component": "Intake Manifold", "ExpertHoursMin": 3.0, "ExpertHoursMax": 6.0, "VMRSCode": "44002003"},
    {"Component": "Intake Manifold Gasket", "ExpertHoursMin": 4.0, "ExpertHoursMax": 8.0, "VMRSCode": "44002004"},
    {"Component": "Turbocharger", "ExpertHoursMin": 6.0, "ExpertHoursMax": 12.0, "VMRSCode": "44003001"},
    {"Component": "Intercooler", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "44004001"},
    {"Component": "Fuel Pump (In-Tank)", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "44002001"},
    {"Component": "Fuel Pump (External)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "44002002"},
    {"Component": "Fuel Filter", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "44004001"},
    {"Component": "Fuel Injectors (Set)", "ExpertHoursMin": 3.0, "ExpertHoursMax": 6.0, "VMRSCode": "44003001"},
    {"Component": "Fuel Rail", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "44003002"},
    {"Component": "Fuel Tank", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.5, "VMRSCode": "44001001"},
    {"Component": "Fuel Lines", "ExpertHoursMin": 1.0, "ExpertHoursMax": 3.0, "VMRSCode": "44005001"},
    {"Component": "Fuel Pressure Regulator", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "44003003"},
    {"Component": "Fuel Sending Unit", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "44001003"},
    {"Component": "Exhaust Manifold", "ExpertHoursMin": 3.0, "ExpertHoursMax": 5.0, "VMRSCode": "43001001"},
    {"Component": "Exhaust Pipe (Front)", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "43004001"},
    {"Component": "Catalytic Converter", "ExpertHoursMin": 1.5, "ExpertHoursMax": 3.0, "VMRSCode": "43005001"},
    {"Component": "Muffler", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "43006001"},
    {"Component": "Tail Pipe", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "43004002"},
    {"Component": "Exhaust Hangers", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "43004003"},
    {"Component": "EGR Valve", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "43007001"},
    {"Component": "EGR Cooler", "ExpertHoursMin": 5.0, "ExpertHoursMax": 8.0, "VMRSCode": "43007002"},
    {"Component": "Front Brake Pads", "ExpertHoursMin": 1.2, "ExpertHoursMax": 1.8, "VMRSCode": "13001001"},
    {"Component": "Rear Brake Pads", "ExpertHoursMin": 1.2, "ExpertHoursMax": 1.8, "VMRSCode": "13001002"},
    {"Component": "Front Brake Rotors", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "13002001"},
    {"Component": "Rear Brake Rotors/Drums", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "13002002"},
    {"Component": "Brake Calipers (Per Wheel)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "13003001"},
    {"Component": "Brake Master Cylinder", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "13005001"},
    {"Component": "Brake Booster", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "13005002"},
    {"Component": "Brake Lines", "ExpertHoursMin": 1.0, "ExpertHoursMax": 3.0, "VMRSCode": "13007001"},
    {"Component": "Brake Hoses", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "13007002"},
    {"Component": "Brake Fluid Flush", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "13009001"},
    {"Component": "ABS Module", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "13010001"},
    {"Component": "ABS Sensors", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "13010002"},
    {"Component": "Parking Brake Cables", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "13008001"},
    {"Component": "Parking Brake Shoes", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "13008002"},
    {"Component": "Air Brake Compressor", "ExpertHoursMin": 4.0, "ExpertHoursMax": 6.0, "VMRSCode": "13011001"},
    {"Component": "A/C Compressor (Vehicle)", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "01001001"},
    {"Component": "Reefer Compressor", "ExpertHoursMin": 4.0, "ExpertHoursMax": 6.0, "VMRSCode": "82002001"},
    {"Component": "A/C Receiver-Dryer", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "01001065"},
    {"Component": "A/C Accumulator", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.0, "VMRSCode": "01001006"},
    {"Component": "A/C Condenser", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "01001003"},
    {"Component": "A/C Evaporator", "ExpertHoursMin": 5.0, "ExpertHoursMax": 8.0, "VMRSCode": "01001004"},
    {"Component": "A/C Expansion Valve", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "01001002"},
    {"Component": "A/C Refrigerant (Per Lb)", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.3, "VMRSCode": "01001273"},
    {"Component": "A/C System Evacuation & Recharge", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "01001274"},
    {"Component": "A/C Belt", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.5, "VMRSCode": "01001008"},
    {"Component": "A/C Pressure Switch", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "01001007"},
    {"Component": "Heater Core", "ExpertHoursMin": 4.0, "ExpertHoursMax": 8.0, "VMRSCode": "01002001"},
    {"Component": "Blower Motor", "ExpertHoursMin": 1.5, "ExpertHoursMax": 3.0, "VMRSCode": "01002002"},
    {"Component": "Cabin Air Filter", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.8, "VMRSCode": "01002003"},
    {"Component": "Automatic Transmission R&R", "ExpertHoursMin": 8.0, "ExpertHoursMax": 12.0, "VMRSCode": "27001001"},
    {"Component": "Manual Transmission R&R", "ExpertHoursMin": 6.0, "ExpertHoursMax": 10.0, "VMRSCode": "28001001"},
    {"Component": "Transmission Fluid Service", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.8, "VMRSCode": "27002001"},
    {"Component": "Transmission Filter", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "27002002"},
    {"Component": "Clutch Kit (Complete)", "ExpertHoursMin": 6.0, "ExpertHoursMax": 10.0, "VMRSCode": "28002001"},
    {"Component": "Clutch Master Cylinder", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "28003001"},
    {"Component": "Clutch Slave Cylinder", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "28003002"},
    {"Component": "CV Joints (Per Side)", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "17001001"},
    {"Component": "CV Axle (Complete)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "17001002"},
    {"Component": "Drive Shaft", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "17002001"},
    {"Component": "U-Joints", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "17002002"},
    {"Component": "Differential Service", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "18001001"},
    {"Component": "Transfer Case Service", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "19001001"},
    {"Component": "Shock Absorbers (Per Axle)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "15001001"},
    {"Component": "Struts (Per Axle)", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "15001002"},
    {"Component": "Coil Springs", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "15002001"},
    {"Component": "Leaf Springs", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "15002002"},
    {"Component": "Sway Bar Links", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "15003001"},
    {"Component": "Sway Bar Bushings", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "15003002"},
    {"Component": "Control Arms", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "15004001"},
    {"Component": "Ball Joints", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "15004002"},
    {"Component": "Wheel Bearings", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "15005001"},
    {"Component": "Air Bags (Air Ride)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "15006001"},
    {"Component": "Power Steering Pump", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "11001001"},
    {"Component": "Power Steering Rack", "ExpertHoursMin": 3.0, "ExpertHoursMax": 5.0, "VMRSCode": "11002001"},
    {"Component": "Steering Gear Box", "ExpertHoursMin": 3.0, "ExpertHoursMax": 5.0, "VMRSCode": "11002002"},
    {"Component": "Tie Rod Ends (Inner/Outer)", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "11003001"},
    {"Component": "Steering Column", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "11004001"},
    {"Component": "Power Steering Hoses", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "11001002"},
    {"Component": "Power Steering Fluid Flush", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "11001003"},
    {"Component": "Tire Mount/Dismount (Per Tire)", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.5, "VMRSCode": "17001001"},
    {"Component": "Tire Rotation (Complete Set)", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "17001002"},
    {"Component": "Tire Repair (Patch/Plug)", "ExpertHoursMin": 0.5, "ExpertHoursMax": 0.8, "VMRSCode": "17001003"},
    {"Component": "Tire Pressure Monitoring Sensor", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "17001004"},
    {"Component": "Wheel Alignment (Front)", "ExpertHoursMin": 1.0, "ExpertHoursMax": 1.5, "VMRSCode": "17002001"},
    {"Component": "Wheel Alignment (4-Wheel)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "17002002"},
    {"Component": "Wheel Balancing (Per Wheel)", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.5, "VMRSCode": "17003001"},
    {"Component": "Door Handle (Exterior)", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "71001001"},
    {"Component": "Door Lock Actuator", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "71001002"},
    {"Component": "Window Motor", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "71002001"},
    {"Component": "Window Regulator", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "71002002"},
    {"Component": "Side Mirror (Complete)", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "71004001"},
    {"Component": "Mirror Glass", "ExpertHoursMin": 0.3, "ExpertHoursMax": 0.8, "VMRSCode": "71004002"},
    {"Component": "Windshield Wipers (Blade)", "ExpertHoursMin": 0.2, "ExpertHoursMax": 0.3, "VMRSCode": "71003001"},
    {"Component": "Wiper Motor", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "71003002"},
    {"Component": "Wiper Arm Linkage", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "71003003"},
    {"Component": "Hood Latch", "ExpertHoursMin": 0.8, "ExpertHoursMax": 1.5, "VMRSCode": "71005001"},
    {"Component": "Tailgate Handle", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "71006001"},
    {"Component": "Seat Motor", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "72001001"},
    {"Component": "Seat Belt", "ExpertHoursMin": 1.0, "ExpertHoursMax": 2.0, "VMRSCode": "72002001"},
    {"Component": "Dashboard Cluster", "ExpertHoursMin": 2.0, "ExpertHoursMax": 4.0, "VMRSCode": "72003001"},
    {"Component": "Radio/lnfotainment", "ExpertHoursMin": 1.5, "ExpertHoursMax": 3.0, "VMRSCode": "72004001"},
    {"Component": "HVAC Controls", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "72005001"},
    {"Component": "Engine Oil & Filter Change", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "PM001001"},
    {"Component": "A-Service (Basic PM)", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "PM002001"},
    {"Component": "B-Service (Standard PM)", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "PM003001"},
    {"Component": "C-Service (Major PM)", "ExpertHoursMin": 4.0, "ExpertHoursMax": 8.0, "VMRSCode": "PM004001"},
    {"Component": "DOT Inspection", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.0, "VMRSCode": "PM005001"},
    {"Component": "Pre-Trip Inspection", "ExpertHoursMin": 0.5, "ExpertHoursMax": 1.0, "VMRSCode": "PM006001"},
    {"Component": "PTO Assembly", "ExpertHoursMin": 4.0, "ExpertHoursMax": 8.0, "VMRSCode": "85001001"},
    {"Component": "PTO Pump", "ExpertHoursMin": 2.5, "ExpertHoursMax": 4.0, "VMRSCode": "85002001"},
    {"Component": "DEF Tank", "ExpertHoursMin": 2.0, "ExpertHoursMax": 3.5, "VMRSCode": "43002001"},
    {"Component": "DEF Doser Valve", "ExpertHoursMin": 1.5, "ExpertHoursMax": 2.5, "VMRSCode": "43002002"},
    {"Component": "DPF Filter", "ExpertHoursMin": 3.0, "ExpertHoursMax": 5.0, "VMRSCode": "43006017"}
  ];

  static analyzeLaborHours(description: string, billedHours: number, laborRate: number = 100): LaborAnalysisResult | null {
    if (!description || billedHours <= 0) return null;

    // Find matching labor standard using fuzzy matching
    const match = this.findBestMatch(description);
    if (!match || !match.ExpertHoursMin || !match.ExpertHoursMax) return null;

    const standardMin = match.ExpertHoursMin;
    const standardMax = match.ExpertHoursMax;
    const standardAvg = (standardMin + standardMax) / 2;

    // Calculate variance percentage
    const variance = ((billedHours - standardAvg) / standardAvg) * 100;

    // Determine status and reason
    let status: 'reasonable' | 'high' | 'excessive';
    let reason: string;
    
    if (billedHours <= standardMax * 1.1) {
      status = 'reasonable';
      reason = `Labor hours (${billedHours}h) are within acceptable range (${standardMin}-${standardMax}h).`;
    } else if (billedHours <= standardMax * 1.5) {
      status = 'high';
      reason = `Labor hours (${billedHours}h) are ${variance.toFixed(1)}% above standard range (${standardMin}-${standardMax}h). Review recommended.`;
    } else {
      status = 'excessive';
      reason = `Labor hours (${billedHours}h) are ${variance.toFixed(1)}% above standard range (${standardMin}-${standardMax}h). Significant overcharge detected.`;
    }

    // Calculate confidence based on description similarity
    const confidence = this.calculateConfidence(description, match.Component);

    return {
      component: match.Component,
      billedHours,
      standardMinHours: standardMin,
      standardMaxHours: standardMax,
      variance,
      status,
      vmrsCode: match.VMRSCode,
      confidence,
      reason
    };
  }

  private static findBestMatch(description: string): LaborStandard | null {
    const normalizedDesc = description.toLowerCase().trim();
    let bestMatch: LaborStandard | null = null;
    let bestScore = 0;

    for (const standard of this.laborStandards) {
      const score = this.calculateSimilarity(normalizedDesc, standard.Component.toLowerCase());
      if (score > bestScore && score > 0.3) { // Minimum similarity threshold
        bestScore = score;
        bestMatch = standard;
      }
    }

    return bestMatch;
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    // Simple keyword-based similarity scoring
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (word1.length > 2) { // Skip very short words
        for (const word2 of words2) {
          if (word2.includes(word1) || word1.includes(word2)) {
            matches++;
            break;
          }
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private static calculateConfidence(description: string, component: string): number {
    const similarity = this.calculateSimilarity(description.toLowerCase(), component.toLowerCase());
    return Math.min(similarity * 100, 95); // Cap at 95%
  }

  static getStandardsForSearch(query: string): LaborStandard[] {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = query.toLowerCase();
    return this.laborStandards
      .filter(standard => 
        standard.Component.toLowerCase().includes(normalizedQuery) ||
        standard.VMRSCode.includes(query.toUpperCase())
      )
      .slice(0, 10); // Limit results
  }
}