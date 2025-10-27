import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow specific frontend origins
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://repairai.withfury.ai',
    '*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Read RSA private key for Snowflake JWT authentication
let privateKey;
try {
  const privateKeyPath = path.resolve('./rsa_key.p8');
  if (fs.existsSync(privateKeyPath)) {
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    console.log('🔑 RSA private key loaded from file for Snowflake JWT authentication');
  } else {
    console.log('❌ RSA key file not found at:', privateKeyPath);
  }
} catch (error) {
  console.log('❌ Error loading RSA key:', error.message);
}

// Snowflake vehicle analysis endpoint
app.post('/api/snowflake/vehicle-analysis', async (req, res) => {
  const { identifier, tenantId, currentPOAmount, timestamp } = req.body;

  if (!identifier || !tenantId || currentPOAmount === undefined) {
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

  return new Promise((resolve) => {
    // Create connection
    const connectionConfig = {
      account: config.account,
      username: config.username,
      warehouse: config.warehouse,
      database: config.database,
      schema: config.schema,
      role: config.role
    };

    // Always use RSA key/JWT authentication to avoid MFA issues
    if (privateKey) {
      console.log('🔑 Using RSA private key authentication (JWT)');
      connectionConfig.privateKey = privateKey;
      connectionConfig.authenticator = 'SNOWFLAKE_JWT';
    } else {
      return resolve(res.status(500).json({
        success: false,
        error: 'No RSA private key available. Please ensure rsa_key.p8 file exists in the backend directory.'
      }));
    }

    const connection = snowflake.createConnection(connectionConfig);

    connection.connect((err) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        return resolve(res.status(500).json({
          success: false,
          error: `Connection failed: ${err.message}`
        }));
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
            return resolve(res.status(500).json({
              success: false,
              error: `Vehicle query failed: ${err.message}`
            }));
          }

          if (rows.length === 0) {
            connection.destroy(() => {});
            return resolve(res.status(404).json({
              success: false,
              error: `Vehicle with identifier ${identifier} not found`
            }));
          }

          const vehicleData = rows[0];
          
          // Get replacement analysis data from ABM_CALENDAR table
          const analysisQuery = `
            SELECT 
              REPLACEMENT_CYCLE,
              REPLACEMENT_TAG,
              REPLACEMENT_TAG_REASON,
              REPLACEMENT_CYCLE_REASON,
              REPLACEMENT_HALF,
              EARLIEST_TRIGGER_DATE,
              CYCLE_TRIGGER_TYPE,
              ESTIMATED_AGE_YEARS as AGE_YEARS,
              ESTIMATED_ODOMETER as ODOMETER_MILES,
              MONTHLY_MILES,
              CURRENT_CPM_USD_PER_MILE,
              CAP_COST as ABM_CAP_COST
            FROM ${config.database}.${config.schema}.ABM_CALENDAR 
            WHERE FURY_VEHICLE_ID = ? AND TENANT_ID = ?
          `;

          connection.execute({
            sqlText: analysisQuery,
            binds: [vehicleData.FURY_VEHICLE_ID, tenantId],
            complete: (err, stmt, analysisRows) => {
              let analysisData = {};
              
              if (err) {
                console.warn('ABM_CALENDAR query failed:', err.message);
                console.log('Using fallback replacement analysis based on lease end date only');
                
                // Fallback analysis - just use lease end date from vehicle data
                analysisData = {
                  REPLACEMENT_CYCLE: null,
                  REPLACEMENT_TAG: null,
                  REPLACEMENT_TAG_REASON: null,
                  REPLACEMENT_CYCLE_REASON: null,
                  LEASE_END_DATE: vehicleData.LEASE_END_DATE,
                  AGE_YEARS: null,
                  ODOMETER_MILES: null
                };
              } else {
                analysisData = analysisRows?.[0] || {};
                console.log('🔄 ABM_CALENDAR replacement analysis data found:', {
                  vehicleNumber: vehicleData.VEHICLE_NUMBER,
                  replacementCycle: analysisData.REPLACEMENT_CYCLE,
                  replacementTag: analysisData.REPLACEMENT_TAG,
                  triggerDate: analysisData.EARLIEST_TRIGGER_DATE
                });
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

              // Check replacement schedule using ABM_CALENDAR data
              let scheduledForReplacement = false;
              let replacementWithinYear = false;
              
              if (analysisData.REPLACEMENT_CYCLE) {
                const currentYear = new Date().getFullYear();
                const replacementCycle = analysisData.REPLACEMENT_CYCLE;
                
                console.log(`🔄 Checking replacement cycle: ${replacementCycle} for vehicle ${vehicleData.VEHICLE_NUMBER}`);
                
                // Check if replacement is scheduled for "Now" or within the next year
                if (replacementCycle === 'Now') {
                  scheduledForReplacement = true;
                  replacementWithinYear = true;
                } else if (replacementCycle.includes(`${currentYear}`) || replacementCycle.includes(`${currentYear + 1}`)) {
                  // Check for cycles like "2025 H1", "2025 H2", "2026 H1"
                  scheduledForReplacement = true;
                  replacementWithinYear = true;
                } else if (replacementCycle === `${currentYear + 1} H1` || replacementCycle === `${currentYear + 1} H2`) {
                  // Next year replacement
                  scheduledForReplacement = true;
                  replacementWithinYear = true;
                }
                
                console.log(`📊 Replacement analysis: scheduled=${scheduledForReplacement}, withinYear=${replacementWithinYear}`);
              }

              // Check EARLIEST_TRIGGER_DATE from ABM_CALENDAR
              if (analysisData.EARLIEST_TRIGGER_DATE && !replacementWithinYear) {
                const triggerDate = new Date(analysisData.EARLIEST_TRIGGER_DATE);
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                
                if (triggerDate <= oneYearFromNow) {
                  replacementWithinYear = true;
                  scheduledForReplacement = true;
                  console.log(`📅 Vehicle trigger date within a year: ${triggerDate.toDateString()}`);
                }
              }

              // Fallback: check vehicle lease end date if no ABM data
              if (vehicleData.LEASE_END_DATE && !replacementWithinYear && !analysisData.REPLACEMENT_CYCLE) {
                const leaseEndDate = new Date(vehicleData.LEASE_END_DATE);
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                
                if (leaseEndDate <= oneYearFromNow) {
                  replacementWithinYear = true;
                  scheduledForReplacement = true;
                  console.log(`📅 Vehicle lease ends within a year: ${leaseEndDate.toDateString()}`);
                }
              }

              // Generate recommendations
              const recommendations = [];
              
              if (exceedsThreshold) {
                recommendations.push(`🚨 CRITICAL: Repair costs will exceed 50% of cap cost (${costPercentage.toFixed(1)}%)`);
                recommendations.push('Consider vehicle replacement instead of repair');
              }

              if (replacementWithinYear) {
                recommendations.push(`🗓️ Vehicle scheduled for replacement: ${analysisData.REPLACEMENT_CYCLE || 'within 12 months'}`);
                if (analysisData.REPLACEMENT_TAG) {
                  recommendations.push(`🏷️ Replacement tag: ${analysisData.REPLACEMENT_TAG}`);
                }
                if (analysisData.REPLACEMENT_CYCLE_REASON) {
                  recommendations.push(`📋 Reason: ${analysisData.REPLACEMENT_CYCLE_REASON}`);
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

              // Do NOT update the database - only provide analysis
              // The REPAIRS field should only be updated when actual repairs are completed
              connection.destroy(() => {});

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
                  // ABM Calendar data
                  replacementCycle: analysisData.REPLACEMENT_CYCLE || null,
                  replacementTag: analysisData.REPLACEMENT_TAG || null,
                  replacementTagReason: analysisData.REPLACEMENT_TAG_REASON || null,
                  replacementCycleReason: analysisData.REPLACEMENT_CYCLE_REASON || null,
                  replacementHalf: analysisData.REPLACEMENT_HALF || null,
                  earliestTriggerDate: analysisData.EARLIEST_TRIGGER_DATE || null,
                  cycleTriggerType: analysisData.CYCLE_TRIGGER_TYPE || null
                }
              };

              resolve(res.status(200).json({
                success: true,
                data: result
              }));
            }
          });
        }
      });
    });
  });
});

// Vehicle lookup endpoint - finds vehicle by identifier across all tenants
app.post('/api/snowflake/vehicle-lookup', async (req, res) => {
  const { identifier, timestamp } = req.body;

  if (!identifier) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required field: identifier' 
    });
  }

  console.log(`🔍 Vehicle lookup request - Vehicle: ${identifier}, Time: ${timestamp || 'N/A'}`);

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
      error: 'Snowflake configuration missing. Please check environment variables.'
    });
  }

  console.log(`🔍 Looking up vehicle: ${identifier}`);

  // Create connection with RSA/JWT authentication
  const connectionConfig = {
    account: config.account,
    username: config.username,
    warehouse: config.warehouse,
    database: config.database,
    schema: config.schema,
    role: config.role
  };

  // Always use RSA key/JWT authentication to avoid MFA issues
  if (privateKey) {
    console.log('🔑 Using RSA private key authentication (JWT)');
    connectionConfig.privateKey = privateKey;
    connectionConfig.authenticator = 'SNOWFLAKE_JWT';
  } else {
    return res.status(500).json({
      success: false,
      error: 'No RSA private key available. Please ensure rsa_key.p8 file exists in the backend directory.'
    });
  }

  const connection = snowflake.createConnection(connectionConfig);

  return new Promise((resolve) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        return resolve(res.status(500).json({
          success: false,
          error: `Connection failed: ${err.message}`
        }));
      }

      console.log('✅ Snowflake connected successfully');

      // Query vehicle data without tenant restriction first
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
        WHERE VIN = ? OR VEHICLE_NUMBER = ?
        LIMIT 1
      `;

      connection.execute({
        sqlText: vehicleQuery,
        binds: [identifier, identifier],
        complete: (err, stmt, rows) => {
          connection.destroy(() => {});
          
          if (err) {
            console.error('❌ Vehicle lookup query failed:', err);
            return resolve(res.status(500).json({
              success: false,
              error: `Vehicle query failed: ${err.message}`
            }));
          }

          if (rows.length === 0) {
            return resolve(res.status(404).json({
              success: false,
              error: `Vehicle with identifier ${identifier} not found`
            }));
          }

          const vehicleData = rows[0];
          
          console.log('✅ Vehicle found:', {
            vehicleId: vehicleData.FURY_VEHICLE_ID,
            tenantId: vehicleData.TENANT_ID,
            vehicleNumber: vehicleData.VEHICLE_NUMBER,
            capCost: vehicleData.CAP_COST,
            repairs: vehicleData.REPAIRS
          });

          resolve(res.json({
            success: true,
            data: {
              vehicleId: vehicleData.FURY_VEHICLE_ID,
              vin: vehicleData.VIN,
              year: vehicleData.MODEL_YEAR ? vehicleData.MODEL_YEAR.toString() : undefined,
              make: vehicleData.MAKE_NAME,
              model: vehicleData.VIN_MODEL,
              vehicleNumber: vehicleData.VEHICLE_NUMBER,
              capCost: vehicleData.CAP_COST || 0,
              lifeToDateRepairCost: vehicleData.REPAIRS || 0,
              tenantId: vehicleData.TENANT_ID,
              leaseEndDate: vehicleData.LEASE_END_DATE
            }
          }));
        }
      });
    });
  });
});

// Vehicle checks endpoint using the cost analysis view
app.post('/api/vehicle/checks', async (req, res) => {
  const { vehicleNumber, currentPOAmount, tenantId } = req.body;

  if (!vehicleNumber || currentPOAmount === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: vehicleNumber, currentPOAmount' 
    });
  }

  console.log(`🔍 Vehicle checks request - Vehicle: ${vehicleNumber}, PO Amount: $${currentPOAmount}, Tenant: ${tenantId || 'Auto-detect'}`);

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

  return new Promise((resolve) => {
    // Create connection
    const connectionConfig = {
      account: config.account,
      username: config.username,
      warehouse: config.warehouse,
      database: config.database,
      schema: config.schema,
      role: config.role
    };

    // Always use RSA key/JWT authentication to avoid MFA issues
    if (privateKey) {
      console.log('🔑 Using RSA private key authentication (JWT)');
      connectionConfig.privateKey = privateKey;
      connectionConfig.authenticator = 'SNOWFLAKE_JWT';
    } else {
      return resolve(res.status(500).json({
        success: false,
        error: 'No RSA private key available. Please ensure rsa_key.p8 file exists in the backend directory.'
      }));
    }

    const connection = snowflake.createConnection(connectionConfig);

    connection.connect((err) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        return resolve(res.status(500).json({
          success: false,
          error: `Connection failed: ${err.message}`
        }));
      }

      console.log('✅ Snowflake connected successfully');

      // Query the vehicle cost analysis view
      let vehicleQuery = `
        SELECT 
          FURY_VECHICLE_ID,
          VIN,
          MAKE_NAME,
          VIN_MODEL,
          MODEL_YEAR,
          CAP_COST,
          REPAIRS,
          VEHICLE_NUMBER,
          TENANT_ID,
          ASSIGNED_CYCLE,
          CALCULATED_ODOMETER,
          VEHICLE_STATUS,
          REPLACEMENT_JUSTIFICATION,
          AGE,
          LEASE_END_DATE,
          ADJ_LEASE_END_DATE
        FROM ${config.database}.${config.schema}.PROD_VEHICLE_COST_ANALYSIS 
        WHERE VEHICLE_NUMBER = ?
      `;

      let binds = [vehicleNumber];

      // Add tenant filter if provided
      if (tenantId) {
        vehicleQuery += ' AND TENANT_ID = ?';
        binds.push(tenantId);
      }

      connection.execute({
        sqlText: vehicleQuery,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            connection.destroy(() => {});
            return resolve(res.status(500).json({
              success: false,
              error: `Vehicle query failed: ${err.message}`
            }));
          }

          if (rows.length === 0) {
            connection.destroy(() => {});
            return resolve(res.status(404).json({
              success: false,
              error: `Vehicle with number ${vehicleNumber} not found`
            }));
          }

          const vehicleData = rows[0];
          
          // Calculate cost analysis
          const lifeToDateRepairCost = typeof vehicleData.REPAIRS === 'number' 
            ? vehicleData.REPAIRS 
            : parseFloat(String(vehicleData.REPAIRS)) || 0;
          
          const capCost = typeof vehicleData.CAP_COST === 'number' 
            ? vehicleData.CAP_COST 
            : parseFloat(String(vehicleData.CAP_COST)) || 0;

          const projectedTotalCost = lifeToDateRepairCost + currentPOAmount;
          const costPercentage = capCost > 0 ? (projectedTotalCost / capCost) * 100 : 0;
          const exceedsThreshold = costPercentage > 50;

          // Check replacement schedule using ASSIGNED_CYCLE
          let scheduledForReplacement = false;
          let replacementWithinYear = false;
          
          if (vehicleData.ASSIGNED_CYCLE) {
            const currentYear = new Date().getFullYear();
            const assignedCycle = vehicleData.ASSIGNED_CYCLE;
            
            console.log(`🔄 Checking assigned cycle: ${assignedCycle} for vehicle ${vehicleNumber}`);
            
            // Check if replacement is scheduled within the next year
            if (assignedCycle.includes(`${currentYear}`) || assignedCycle.includes(`${currentYear + 1}`)) {
              // Check for cycles like "2025 H1", "2025 H2", "2026 H1"
              scheduledForReplacement = true;
              replacementWithinYear = true;
            }
            
            console.log(`📊 Replacement analysis: scheduled=${scheduledForReplacement}, withinYear=${replacementWithinYear}`);
          }

          // Also check lease end date as backup
          if (vehicleData.ADJ_LEASE_END_DATE && !replacementWithinYear) {
            const leaseEndDate = new Date(vehicleData.ADJ_LEASE_END_DATE);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            if (leaseEndDate <= oneYearFromNow) {
              replacementWithinYear = true;
              scheduledForReplacement = true;
              console.log(`📅 Vehicle lease ends within a year: ${leaseEndDate.toDateString()}`);
            }
          }

          connection.destroy(() => {});

          const vehicleCheckResult = {
            vehicleNumber: vehicleData.VEHICLE_NUMBER,
            capCost,
            currentRepairs: projectedTotalCost,
            repairPercentage: costPercentage,
            exceedsCapCostThreshold: exceedsThreshold,
            assignedCycle: vehicleData.ASSIGNED_CYCLE || 'Not Assigned',
            scheduledForReplacement,
            replacementJustification: vehicleData.REPLACEMENT_JUSTIFICATION || 'No specific justification available',
            vehicleDetails: {
              vin: vehicleData.VIN || '',
              make: vehicleData.MAKE_NAME || '',
              model: vehicleData.VIN_MODEL || '',
              year: vehicleData.MODEL_YEAR || 0,
              mileage: vehicleData.CALCULATED_ODOMETER || 0,
              vehicleStatus: vehicleData.VEHICLE_STATUS || 'Unknown'
            }
          };

          resolve(res.status(200).json({
            success: true,
            data: vehicleCheckResult
          }));
        }
      });
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Snowflake API available at http://localhost:${PORT}/api/snowflake/vehicle-analysis`);
  console.log(`🔍 Vehicle lookup available at http://localhost:${PORT}/api/snowflake/vehicle-lookup`);
  console.log(`🚗 Vehicle checks available at http://localhost:${PORT}/api/vehicle/checks`);
  console.log(`🛒 SerpAPI proxy available at http://localhost:${PORT}/api/serpapi/price-lookup`);
});