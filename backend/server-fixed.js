// Fixed server.js with proper assigned cycle logic
const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load RSA private key
let privateKey = null;
try {
  const keyPath = path.join(__dirname, 'rsa_key.p8');
  privateKey = fs.readFileSync(keyPath, 'utf8');
  console.log('🔑 RSA private key loaded from file for Snowflake JWT authentication');
} catch (error) {
  console.error('❌ Failed to load RSA private key:', error.message);
}

// Vehicle analysis endpoint - FIXED VERSION
app.post('/api/snowflake/vehicle-analysis', async (req, res) => {
  const { identifier, tenantId, currentPOAmount, timestamp } = req.body;

  if (!identifier || !tenantId || typeof currentPOAmount !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: identifier, tenantId, currentPOAmount'
    });
  }

  console.log(`🔍 Vehicle analysis request - Vehicle: ${identifier}, Tenant: ${tenantId}, PO: $${currentPOAmount}, Time: ${timestamp || 'N/A'}`);

  const config = {
    account: process.env.SNOWFLAKE_ACCOUNT || '',
    username: process.env.SNOWFLAKE_USER || '',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
    database: process.env.SNOWFLAKE_DATABASE || 'PROD',
    schema: process.env.SNOWFLAKE_SCHEMA || 'FLEET',
    role: process.env.SNOWFLAKE_ROLE || 'SYSADMIN'
  };

  if (!config.account || !config.username) {
    return res.status(500).json({
      success: false,
      error: 'Missing Snowflake configuration'
    });
  }

  if (!privateKey) {
    return res.status(500).json({
      success: false,
      error: 'No RSA private key available. Please ensure rsa_key.p8 file exists in the backend directory.'
    });
  }

  try {
    const connection = snowflake.createConnection({
      account: config.account,
      username: config.username,
      warehouse: config.warehouse,
      database: config.database,
      schema: config.schema,
      role: config.role,
      privateKey: privateKey,
      authenticator: 'SNOWFLAKE_JWT'
    });

    connection.connect((err) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        return res.status(500).json({
          success: false,
          error: `Connection failed: ${err.message}`
        });
      }

      console.log('✅ Snowflake connected successfully');

      // First, get vehicle data
      const vehicleQuery = `
        SELECT 
          FURY_VEHICLE_ID,
          VIN,
          MAKE_NAME,
          VIN_MODEL,
          MODEL_YEAR,
          CAP_COST,
          REPAIRS,
          VEHICLE_NUMBER,
          TENANT_ID,
          LEASE_END_DATE
        FROM ${config.database}.${config.schema}.VEHICLE 
        WHERE (VIN = ? OR VEHICLE_NUMBER = ?) AND TENANT_ID = ?
      `;

      connection.execute({
        sqlText: vehicleQuery,
        binds: [identifier, identifier, tenantId],
        complete: (err, stmt, rows) => {
          if (err) {
            connection.destroy(() => {});
            return res.status(500).json({
              success: false,
              error: `Vehicle query failed: ${err.message}`
            });
          }

          if (rows.length === 0) {
            connection.destroy(() => {});
            return res.status(404).json({
              success: false,
              error: `Vehicle with identifier ${identifier} not found`
            });
          }

          const vehicleData = rows[0];
          console.log(`📊 Vehicle found: ${vehicleData.VEHICLE_NUMBER}`);

          // Now get assigned cycle data
          const analysisQuery = `
            SELECT 
              ASSIGNED_CYCLE,
              REPLACEMENT_JUSTIFICATION,
              AGE,
              MONTHLY_MILES,
              LEASE_END_DATE
            FROM ${config.database}.${config.schema}.PROD_VEHICLE_COST_ANALYSIS 
            WHERE VEHICLE_NUMBER = ?
          `;

          connection.execute({
            sqlText: analysisQuery,
            binds: [vehicleData.VEHICLE_NUMBER],
            complete: (analysisErr, analysisStmt, analysisRows) => {
              connection.destroy(() => {});

              // Process assigned cycle data
              let assignedCycle = null;
              let replacementJustification = 'No analysis data available';
              let vehicleAge = null;

              if (analysisErr) {
                console.warn('⚠️  PROD_VEHICLE_COST_ANALYSIS query failed:', analysisErr.message);
                // Calculate fallback from lease end date
                if (vehicleData.LEASE_END_DATE) {
                  const leaseEnd = new Date(vehicleData.LEASE_END_DATE);
                  const year = leaseEnd.getFullYear();
                  const month = leaseEnd.getMonth() + 1;
                  assignedCycle = month <= 6 ? `${year} H1` : `${year} H2`;
                  replacementJustification = 'Calculated from lease end date';
                  console.log(`📅 Calculated assigned cycle from lease end: ${assignedCycle}`);
                }
              } else if (analysisRows && analysisRows.length > 0) {
                const analysisData = analysisRows[0];
                assignedCycle = analysisData.ASSIGNED_CYCLE;
                replacementJustification = analysisData.REPLACEMENT_JUSTIFICATION || 'From analysis view';
                vehicleAge = analysisData.AGE;
                console.log(`✅ Analysis data found - Assigned Cycle: ${assignedCycle}`);
              } else {
                console.log('⚠️  No analysis data found for vehicle');
              }

              // Calculate repair cost analysis
              const lifeToDateRepairCost = typeof vehicleData.REPAIRS === 'number' 
                ? vehicleData.REPAIRS
                : parseFloat(String(vehicleData.REPAIRS)) || 0;
              
              const capCost = typeof vehicleData.CAP_COST === 'number' 
                ? vehicleData.CAP_COST
                : parseFloat(String(vehicleData.CAP_COST)) || 0;

              const projectedTotalCost = lifeToDateRepairCost + currentPOAmount;
              const costPercentage = capCost > 0 ? (projectedTotalCost / capCost) * 100 : 0;
              const exceedsThreshold = costPercentage > 50;

              // ASSIGNED CYCLE REPLACEMENT LOGIC
              const currentYear = new Date().getFullYear();
              let scheduledForReplacement = false;
              let replacementWithinYear = false;

              console.log(`🔄 Analyzing assigned cycle: "${assignedCycle}" for vehicle ${vehicleData.VEHICLE_NUMBER}`);
              console.log(`📅 Current year: ${currentYear}`);

              if (assignedCycle) {
                const cycle = assignedCycle.toString().trim();
                
                if (cycle === 'Now' || cycle.toLowerCase() === 'immediate') {
                  scheduledForReplacement = true;
                  replacementWithinYear = true;
                  console.log(`🚨 IMMEDIATE replacement flagged for cycle: ${cycle}`);
                } else if (cycle.includes(`${currentYear}`) || cycle.includes(`${currentYear + 1}`)) {
                  scheduledForReplacement = true;
                  replacementWithinYear = true;
                  console.log(`📅 SCHEDULED replacement flagged for cycle: ${cycle}`);
                } else {
                  console.log(`ℹ️  Future replacement cycle: ${cycle} (not within year)`);
                }
              } else {
                console.log(`⚠️  No assigned cycle found for vehicle ${vehicleData.VEHICLE_NUMBER}`);
              }

              console.log(`📊 Final replacement flags: scheduled=${scheduledForReplacement}, withinYear=${replacementWithinYear}`);

              // Generate recommendations
              const recommendations = [];
              
              if (exceedsThreshold) {
                recommendations.push(`🚨 CRITICAL: Repair costs will exceed 50% of cap cost (${costPercentage.toFixed(1)}%)`);
                recommendations.push('Consider vehicle replacement instead of repair');
              }

              if (replacementWithinYear) {
                recommendations.push(`🗓️ Vehicle scheduled for replacement: ${assignedCycle || 'within 12 months'}`);
                if (replacementJustification) {
                  recommendations.push(`📋 Reason: ${replacementJustification}`);
                }
                recommendations.push('Evaluate if current repair is cost-effective given replacement timeline');
              }

              if (exceedsThreshold && replacementWithinYear) {
                recommendations.push('⚠️ RECOMMENDATION: Defer non-critical repairs - vehicle replacement imminent');
              }

              if (costPercentage > 40 && costPercentage <= 50) {
                recommendations.push('⚠️ CAUTION: Approaching 50% repair cost threshold');
                recommendations.push('Monitor future repair costs closely');
              }

              if (costPercentage > 30 && costPercentage <= 40) {
                recommendations.push('📊 INFO: Repair costs at moderate level (30-40% of cap cost)');
              }

              const result = {
                vehicleData: {
                  vehicleId: vehicleData.FURY_VEHICLE_ID,
                  vin: vehicleData.VIN,
                  year: vehicleData.MODEL_YEAR?.toString(),
                  make: vehicleData.MAKE_NAME,
                  model: vehicleData.VIN_MODEL,
                  vehicleNumber: vehicleData.VEHICLE_NUMBER,
                  capCost,
                  lifeToDateRepairCost,
                  tenantId: vehicleData.TENANT_ID
                },
                costAnalysis: {
                  currentRepairCost: currentPOAmount,
                  totalLifeToDateCost: lifeToDateRepairCost,
                  projectedTotalCost,
                  capCost,
                  costPercentage,
                  exceedsThreshold,
                  scheduledForReplacement,
                  replacementWithinYear,
                  recommendations,
                  // ASSIGNED CYCLE DATA
                  assignedCycle: assignedCycle,
                  replacementJustification: replacementJustification,
                  vehicleAge: vehicleAge,
                  monthlyMiles: null,
                  sqScore: null,
                  roiPerDollar: null,
                  netBudgetBurden: null,
                  p12moc: null,
                  p12cor: null,
                  leaseEndDate: vehicleData.LEASE_END_DATE
                }
              };

              console.log('📋 Final API response:', {
                success: true,
                assignedCycle: result.costAnalysis.assignedCycle,
                scheduledForReplacement: result.costAnalysis.scheduledForReplacement,
                replacementWithinYear: result.costAnalysis.replacementWithinYear
              });

              return res.status(200).json({
                success: true,
                data: result
              });
            }
          });
        }
      });
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Keep other endpoints from original server...
// (Vehicle lookup, SerpAPI, etc.)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🔑 RSA private key loaded from file for Snowflake JWT authentication');
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Snowflake API available at http://localhost:${PORT}/api/snowflake/vehicle-analysis`);
  console.log(`🔍 Vehicle lookup available at http://localhost:${PORT}/api/snowflake/vehicle-lookup`);
});