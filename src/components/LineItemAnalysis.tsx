import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLineItemAnalysis } from '@/hooks/useLineItemAnalysis';
import type { LineItem } from '@/services/POParser';
import { ExternalLink, Settings2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { LaborHoursAnalysis } from './LaborHoursAnalysis';

interface Props {
  lineItems: LineItem[];
}

export const LineItemAnalysis: React.FC<Props> = ({ lineItems }) => {
  const { rows, summary, loading } = useLineItemAnalysis(lineItems, {
    excessiveQtyThreshold: 20,
  });

  // Column visibility state for parts table
  const [partsColumns, setPartsColumns] = useState({
    quantity: true,
    unitPrice: true,
    description: true,
    type: true,
    ataCode: true,
    correction: true,
    cause: true,
    itemsTotal: true,
    marketAvg: true,
    variance: true,
    status: true,
    reason: false,
    furyAiNote: true,
  });

  const [showPartsColumnSettings, setShowPartsColumnSettings] = useState(false);

  // Generate Fury AI explanation for each line item
  const generateFuryAiNote = (row: any) => {
    const dollarDiff = row.marketAvg !== undefined ? row.unitCost - row.marketAvg : 0;
    const percentDiff = row.percentDiff || 0;
    
    // Determine the icon and status
    let icon, status, explanation;
    
    if (row.status.includes('Rejected')) {
      icon = <AlertTriangle className="h-4 w-4 text-red-600" />;
      status = 'REJECTED';
      if (percentDiff > 50) {
        explanation = `Price is ${percentDiff.toFixed(1)}% above market average ($${Math.abs(dollarDiff).toFixed(2)} over). This represents excessive markup and should be negotiated or sourced elsewhere.`;
      } else if (row.quantity > 10) {
        explanation = `High quantity (${row.quantity}) ordered. Verify this quantity is actually needed to avoid overstocking and unnecessary expense.`;
      } else {
        explanation = `Item flagged for review due to pricing concerns. Consider alternative suppliers or negotiate better rates.`;
      }
    } else if (row.status.includes('Caution')) {
      icon = <Info className="h-4 w-4 text-orange-600" />;
      status = 'CAUTION';
      if (percentDiff > 15) {
        explanation = `Price is ${percentDiff.toFixed(1)}% above market average ($${Math.abs(dollarDiff).toFixed(2)} over). Consider negotiating or seeking quotes from alternative suppliers.`;
      } else if (percentDiff > 5) {
        explanation = `Slightly above market rate but within acceptable range. Monitor pricing trends for future orders.`;
      } else {
        explanation = `Item requires attention due to quantity or other factors. Review necessity and timing of this purchase.`;
      }
    } else {
      icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
      status = 'APPROVED';
      if (percentDiff < -10) {
        explanation = `Excellent pricing - ${Math.abs(percentDiff).toFixed(1)}% below market average. Great value for this item.`;
      } else if (percentDiff < 0) {
        explanation = `Good pricing - ${Math.abs(percentDiff).toFixed(1)}% below market average. Favorable deal secured.`;
      } else if (percentDiff <= 5) {
        explanation = `Market-competitive pricing. This is a fair price for the item and vendor relationship.`;
      } else {
        explanation = `Standard pricing for this type of item. Cost is reasonable and within expected range.`;
      }
    }
    
    return { icon, status, explanation };
  };

  if (!lineItems || lineItems.length === 0) return null;

  // Separate parts and labor items
  const partsRows = rows.filter(row => 
    row.type.toLowerCase() === 'part' || row.type.toLowerCase() === 'other'
  );
  const laborRows = rows.filter(row => row.type.toLowerCase() === 'labor');

  return (
    <div className="space-y-6">
      {/* Parts Analysis Table */}
      {partsRows.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parts & Other Items Analysis</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPartsColumnSettings(!showPartsColumnSettings)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Columns
              </Button>
              <Badge variant="outline">{partsRows.length} items analyzed</Badge>
            </div>
          </div>

          {/* Parts Column Settings */}
          {showPartsColumnSettings && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium mb-3">Show/Hide Columns</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(partsColumns).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`parts-${key}`}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setPartsColumns(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <label htmlFor={`parts-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-sm text-muted-foreground">Analyzing parts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {partsColumns.quantity && <th className="text-left py-2 font-medium text-muted-foreground">Quantity</th>}
                    {partsColumns.unitPrice && <th className="text-left py-2 font-medium text-muted-foreground">Your Price ($)</th>}
                    {partsColumns.description && <th className="text-left py-2 font-medium text-muted-foreground">Description</th>}
                    {partsColumns.type && <th className="text-left py-2 font-medium text-muted-foreground">Type</th>}
                     {partsColumns.ataCode && <th className="text-left py-2 font-medium text-muted-foreground">ATA Code</th>}
                     {partsColumns.correction && <th className="text-left py-2 font-medium text-muted-foreground">Correction</th>}
                     {partsColumns.cause && <th className="text-left py-2 font-medium text-muted-foreground">Cause</th>}
                     {partsColumns.itemsTotal && <th className="text-left py-2 font-medium text-muted-foreground">Items Total ($)</th>}
                    {partsColumns.marketAvg && <th className="text-left py-2 font-medium text-muted-foreground">Market Avg ($)</th>}
                    {partsColumns.variance && <th className="text-left py-2 font-medium text-muted-foreground">Variance</th>}
                    {partsColumns.status && <th className="text-left py-2 font-medium text-muted-foreground">Status</th>}
                    {partsColumns.reason && <th className="text-left py-2 font-medium text-muted-foreground">Reason</th>}
                    {partsColumns.furyAiNote && <th className="text-left py-2 font-medium text-muted-foreground">Fury AI Note</th>}
                  </tr>
                </thead>
                <tbody>
                  {partsRows.map((row, idx) => {
                    // Market average is already per unit, so no need to divide by quantity
                    const dollarDiff = row.marketAvg !== undefined ? row.unitCost - row.marketAvg : undefined;
                    return (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        {partsColumns.quantity && <td className="py-3 text-left">{row.quantity}</td>}
                        {partsColumns.unitPrice && <td className="py-3 text-left">${row.unitCost.toFixed(2)}</td>}
                        {partsColumns.description && <td className="py-3 text-left max-w-xs truncate">{row.description}</td>}
                        {partsColumns.type && <td className="py-3 text-left">{row.type}</td>}
                         {partsColumns.ataCode && <td className="py-3 text-left">{row.ataCode}</td>}
                         {partsColumns.correction && <td className="py-3 text-left max-w-xs truncate">{row.correction || '-'}</td>}
                         {partsColumns.cause && <td className="py-3 text-left max-w-xs truncate">{row.cause || '-'}</td>}
                         {partsColumns.itemsTotal && <td className="py-3 text-left">${row.itemsTotal.toFixed(2)}</td>}
                        {partsColumns.marketAvg && <td className="py-3 text-left">{row.marketAvg !== undefined ? `$${row.marketAvg.toFixed(2)}` : '-'}</td>}
                        {partsColumns.variance && (
                          <td className="py-3 text-left">
                            {row.percentDiff !== undefined && dollarDiff !== undefined ? (
                              <div className="space-y-1">
                                <div className={`font-mono text-sm ${row.percentDiff > 15 ? 'text-red-600' : row.percentDiff > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {row.percentDiff > 0 ? '+' : ''}{row.percentDiff.toFixed(1)}%
                                </div>
                                <div className={`font-mono text-xs ${dollarDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {dollarDiff > 0 ? '+' : ''}${dollarDiff.toFixed(2)}
                                </div>
                              </div>
                            ) : '-'}
                          </td>
                        )}
                        {partsColumns.status && (
                          <td className="py-3 text-left">
                            <Badge
                              variant={
                                row.status.includes('Approved')
                                  ? 'default'
                                  : row.status.includes('Caution')
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {row.status}
                            </Badge>
                          </td>
                        )}
                        {partsColumns.reason && (
                          <td className="py-3 text-left max-w-xs">
                            <span className="text-sm text-muted-foreground">{row.reason}</span>
                          </td>
                        )}
                        {partsColumns.furyAiNote && (
                          <td className="py-3 text-left max-w-md">
                            {(() => {
                              const aiNote = generateFuryAiNote(row);
                              return (
                                <div className="flex items-start space-x-2">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {aiNote.icon}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className={`text-xs font-medium mb-1 ${
                                      aiNote.status === 'APPROVED' ? 'text-green-600' :
                                      aiNote.status === 'CAUTION' ? 'text-orange-600' : 'text-red-600'
                                    }`}>
                                      {aiNote.status}
                                    </div>
                                    <div className="text-xs text-gray-700 leading-relaxed">
                                      {aiNote.explanation}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Labor Hours Analysis */}
      {summary?.laborAnalysis && summary.laborAnalysis.length > 0 && (
        <LaborHoursAnalysis 
          laborAnalysis={summary.laborAnalysis} 
          loading={loading} 
        />
      )}

      {/* Summary Metrics */}
      {summary && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="flex flex-col p-3 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Invoice Total ($)</span>
              <span className="font-semibold">{summary.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col p-3 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Market Avg Total ($)</span>
              <span className="font-semibold">{summary.totalMarketAvg > 0 ? summary.totalMarketAvg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</span>
            </div>
            <div className="flex flex-col p-3 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Approved</span>
              <span className="font-semibold">{summary.approved}</span>
            </div>
            <div className="flex flex-col p-3 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Caution</span>
              <span className="font-semibold">{summary.caution}</span>
            </div>
            <div className="flex flex-col p-3 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-semibold">{summary.rejected}</span>
            </div>
          </div>

          {summary?.grandTotalFlag && (
            <div className="mt-3 text-sm text-muted-foreground">{summary.grandTotalFlag}</div>
          )}
        </Card>
      )}
    </div>
  );
};
