console.log('Testing fleet management parsing...');

// Simulate the fleet management repair detail section
const repairDetailText = `
Repair Detail

Repair Description                           Detail    Quantity    Parts    Labor    Paid
TIRE SERVICES LABOR LBR                               1           $0.00    $0.00    $321.83
- TPMS REBUILD VALVE KIT VALVE SERVICE KIT            4           $35.96   $0.00    $0.00
- AIR PRESSURE SENSOR TIRE TPMS                       4           $155.96  $0.00    $0.00
- TIRE DISPOSAL FEE TAX PET WASTE                     1           $0.00    $29.96   $0.00
- LABOR TIRE INSTALLATION PACKAGE                     1           $0.00    $79.96   $0.00
- LABOR AIR PRESSURE SENSOR TPMS                      1           $0.00    $25.99   $0.00
TIRE PASSENGER TIRES                                  5           $0.00    $0.00    $623.96
- PASSENGER TIRES                                     1           $0.00    $0.00    $0.00
- LIGHT TRUCK TIRES                                   4           $623.96  $0.00    $0.00
SALES TAX                                             1           $0.00    $0.00    $55.20
`;

// Expected line items with non-zero "Paid" amounts:
const expectedLineItems = [
  { description: 'TIRE SERVICES LABOR LBR', paid: 321.83 },
  { description: 'TIRE PASSENGER TIRES', paid: 623.96 },
  { description: 'SALES TAX', paid: 55.20 }
];

// Expected total: 321.83 + 623.96 + 55.20 = 1000.99
const expectedTotal = 1000.99;

console.log('✅ Expected line items that should be extracted:');
expectedLineItems.forEach(item => {
  console.log(`  - ${item.description}: $${item.paid}`);
});
console.log(`✅ Expected PO Total: $${expectedTotal}`);
console.log('');
console.log('❌ Should NOT use: Total Spent: $7,634.59');
console.log('');

// Test the pattern matching
const lines = repairDetailText.split('\n').filter(line => line.trim());

console.log('📊 Testing pattern matching on actual lines:');
lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed && trimmed.includes('$')) {
    console.log(`Line ${index}: ${trimmed}`);
    
    // Test our pattern
    const pattern = /^(.*?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)$/;
    const match = trimmed.match(pattern);
    
    if (match) {
      const description = match[1].trim();
      const quantity = match[2];
      const parts = parseFloat(match[3].replace(/,/g, ''));
      const labor = parseFloat(match[4].replace(/,/g, ''));
      const paid = parseFloat(match[5].replace(/,/g, ''));
      
      if (paid > 0) {
        console.log(`  ✅ MATCH: ${description} - Paid: $${paid}`);
      } else {
        console.log(`  ⚠️  No paid amount: ${description}`);
      }
    } else {
      console.log(`  ❌ No match for pattern`);
    }
  }
});