import { useEffect, useMemo, useState } from 'react';
import { SerpAPIService } from '@/services/SerpAPIService';
import type { LineItem } from '@/services/POParser';
import { LaborHoursService, LaborAnalysisResult } from '@/services/LaborHoursService';

export type AnalysisStatus = 'Approved ✅' | 'Caution ⚠️' | 'Rejected ❌';

export interface AnalysisRow {
  quantity: number;
  unitCost: number;
  description: string;
  type: string;
  ataCode: string;
  correction?: string;
  cause?: string;
  itemsTotal: number;
  marketAvg?: number;
  marketAvgTotal?: number;
  dollarDiff?: number;
  percentDiff?: number;
  referenceLinks: string[];
  shoppingSearchUrl: string;
  status: AnalysisStatus;
  reason: string;
}

export interface AnalysisSummary {
  totalBill: number;
  totalMarketAvg: number;
  approved: number;
  caution: number;
  rejected: number;
  grandTotalFlag?: string;
  laborAnalysis: LaborAnalysisResult[];
}

interface Options {
  excessiveQtyThreshold?: number; // e.g., 20
}

export function useLineItemAnalysis(
  lineItems: LineItem[] | undefined,
  options: Options = {}
) {
  const { excessiveQtyThreshold = 20 } = options;

  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const duplicatesSet = useMemo(() => {
    const set = new Set<string>();
    const seen: Record<string, number> = {};
    (lineItems || []).forEach((it) => {
      const key = `${(it.description || '').trim().toLowerCase()}|${(it.type || '').trim().toLowerCase()}|${(it.ataCode || '').trim()}`;
      seen[key] = (seen[key] || 0) + 1;
    });
    Object.keys(seen).forEach((k) => {
      if (seen[k] > 1) set.add(k);
    });
    return set;
  }, [lineItems]);

  useEffect(() => {
    let cancel = false;

    async function analyze() {
    if (!lineItems || lineItems.length === 0) {
      setRows([]);
      setSummary({ totalBill: 0, totalMarketAvg: 0, approved: 0, caution: 0, rejected: 0, laborAnalysis: [] });
      return;
    }

      setLoading(true);
      setError(undefined);

      const vagueKeywords = ['misc', 'other', 'unknown', 'part', 'item'];

    let totalBill = 0;
    let totalMarketAvg = 0;
    let approved = 0;
    let caution = 0;
    let rejected = 0;

    const newRows: AnalysisRow[] = [];
    const laborResults: LaborAnalysisResult[] = [];

      for (const item of lineItems) {
        if (cancel) break;

        const qty = Math.max(1, parseInt(item.quantity || '1', 10) || 1);
        const unitCost = typeof item.unitPrice === 'number' && item.unitPrice > 0
          ? item.unitPrice
          : (item.total || 0) / qty;
        const desc = (item.description || '').trim();
        const type = (item.type || 'other').toString();
        const ataCode = (item.ataCode || '').toString();
        const correction = (item.correction || '').toString();
        const cause = (item.cause || '').toString();

        const itemsTotal = (unitCost * qty) || 0;
        totalBill += (item.total || itemsTotal || 0);

        // Labor hours analysis for labor/service items
        // Only analyze items that are explicitly marked as labor type
        if (type.toLowerCase() === 'labor' || 
            (type.toLowerCase() !== 'part' && 
             (desc.toLowerCase().includes('labor') || 
              desc.toLowerCase().includes('service')))) {
          
          // For labor items, quantity represents working hours
          const workingHours = qty; // quantity IS the hours for labor items
          
          if (workingHours > 0) {
            const laborAnalysis = LaborHoursService.analyzeLaborHours(desc, workingHours, 130); // $130/hour standard rate
            
            if (laborAnalysis) {
              // Add correction and cause to labor analysis result
              laborResults.push({
                ...laborAnalysis,
                correction,
                cause
              });
            }
          }
        }

        // Default values
        let status: AnalysisStatus = 'Approved ✅';
        let reason = '';
        let marketAvg: number | undefined = undefined;
        let marketAvgTotal: number | undefined = undefined;
        let dollarDiff: number | undefined = undefined;
        let percentDiff: number | undefined = undefined;
        let referenceLinks: string[] = [];

        // Completeness check
        if (!desc || unitCost <= 0 || qty <= 0) {
          status = 'Rejected ❌';
          reason = 'Missing or zero values for description, quantity, or unit cost.';
          rejected += 1;
        } else {
          // Duplicate check (Description + Type + ATA)
          const dkey = `${desc.toLowerCase()}|${type.toLowerCase()}|${ataCode}`;
          if (duplicatesSet.has(dkey)) {
            status = 'Caution ⚠️';
            reason = 'Duplicate line detected (same Description, Type, and ATA Code). Please review or merge items.';
            caution += 1;
          }

          // Description clarity check
          if (!reason && vagueKeywords.some((kw) => desc.toLowerCase().includes(kw))) {
            status = 'Caution ⚠️';
            reason = 'Description is unclear or vague. Please provide a standard part name.';
            caution += 1;
          }

          // Quantity sanity check
          if (!reason && qty > excessiveQtyThreshold) {
            status = 'Caution ⚠️';
            reason = `Quantity ${qty} is unusually high for a single invoice. Please verify fleet needs.`;
            caution += 1;
          }

          // Build search query for reference links
          let searchQuery = '';
          if (type.toLowerCase() === 'part') {
            searchQuery = `${desc} ${ataCode} ${correction} ${cause} part`.trim();
          } else if (type.toLowerCase() === 'labor') {
            searchQuery = `${desc} ${ataCode} labor ${correction} ${cause}`.trim();
          } else {
            searchQuery = `${desc} ${type} ${ataCode} ${correction} ${cause}`.trim();
          }
          const shoppingSearchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`;

          // Only fetch market price for parts, not labor or other items
          if (type.toLowerCase() === 'part') {
            try {
              const partCode = (item.partNumber || item.laborCode || '').toString();
              const res = await SerpAPIService.getMarketPrice(desc, partCode);
              if (res.success && res.averagePrice) {
                marketAvg = res.averagePrice;
                marketAvgTotal = marketAvg * qty;
                totalMarketAvg += marketAvgTotal;
                referenceLinks = (res.sources || []).slice(0, 3).map((s) => s.link);

                // Calculate dollar and percentage differences
                dollarDiff = unitCost - marketAvg;
                percentDiff = ((unitCost - marketAvg) / marketAvg) * 100;

                // Simplified status based on market comparison (no threshold)
                if (!reason) {
                  if (unitCost <= marketAvg) {
                    status = 'Approved ✅';
                    reason = `Unit cost ($${unitCost.toFixed(2)}) is at or below the market average ($${marketAvg.toFixed(2)}).`;
                    approved += 1;
                  } else {
                    // Any amount above market average is flagged for review
                    const overagePercent = ((unitCost - marketAvg) / marketAvg) * 100;
                    if (overagePercent <= 25) {
                      status = 'Caution ⚠️';
                      reason = `Unit cost ($${unitCost.toFixed(2)}) is ${overagePercent.toFixed(1)}% above market average ($${marketAvg.toFixed(2)}). Review recommended.`;
                      caution += 1;
                    } else {
                      status = 'Rejected ❌';
                      reason = `Unit cost ($${unitCost.toFixed(2)}) is ${overagePercent.toFixed(1)}% above market average ($${marketAvg.toFixed(2)}). Significant overpayment detected.`;
                      rejected += 1;
                    }
                  }
                }
              } else {
                if (!reason) {
                  status = 'Caution ⚠️';
                  reason = 'No market price data found for this item. Please check the description or try a more common term.';
                  caution += 1;
                }
              }
            } catch (err) {
              if (!reason) {
                status = 'Caution ⚠️';
                reason = 'Market price verification failed. Check network or API key configuration.';
                caution += 1;
              }
            }
          } else if (type.toLowerCase() === 'labor') {
            // For labor items, skip market price comparison and set appropriate status
            if (!reason) {
              status = 'Approved ✅';
              reason = 'Labor item - analyzed separately in Labor Hours Analysis section.';
              approved += 1;
            }
          } else {
            // For other items, skip market price comparison
            if (!reason) {
              status = 'Approved ✅';
              reason = 'Non-part item - no market price comparison available.';
              approved += 1;
            }
          }

          // Items total validation
          if (Math.abs(itemsTotal - unitCost * qty) > 0.01) {
            if (status === 'Approved ✅') status = 'Caution ⚠️';
            reason = 'Items total does not match Qty × Unit Cost. Please check for errors or inflation.';
            if (status === 'Caution ⚠️') caution += 0; // already counted
          }

          // Ensure at least approved counted if nothing set yet
          if (!reason) {
            approved += 1;
            reason = 'Within acceptable range.';
          }

          // Push row
          newRows.push({
            quantity: qty,
            unitCost,
            description: desc,
            type,
            ataCode,
            correction,
            cause,
            itemsTotal,
            marketAvg,
            marketAvgTotal,
            dollarDiff,
            percentDiff,
            referenceLinks,
            shoppingSearchUrl,
            status,
            reason,
          });
        }
      }

      // Grand total vs market check
      let grandTotalFlag: string | undefined;
      if (totalMarketAvg > 0) {
        const variance = totalBill - totalMarketAvg;
        const pct = (variance / totalMarketAvg) * 100;
        if (pct > 20) {
          grandTotalFlag = 'Rejected ❌: Invoice total exceeds market average by more than 20%.';
        } else if (pct > 10) {
          grandTotalFlag = 'Caution ⚠️: Invoice total is 10–20% higher than market average. Please review.';
        }
      }

      if (!cancel) {
        setRows(newRows);
        setSummary({ totalBill, totalMarketAvg, approved, caution, rejected, grandTotalFlag, laborAnalysis: laborResults });
        setLoading(false);
      }
    }

    analyze();

    return () => {
      cancel = true;
    };
  }, [lineItems, excessiveQtyThreshold, duplicatesSet]);

  return { rows, summary, loading, error };
}
