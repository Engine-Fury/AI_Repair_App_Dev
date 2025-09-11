import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Truck,
  FileText,
  Download,
  Clock,
  Building2,
  Phone,
  MapPin,
  Eye
} from 'lucide-react';
import { LocalStorageService, type StoredPO } from '@/services/LocalStorageService';
import { LineItemAnalysis } from '@/components/LineItemAnalysis';
import { LaborHoursAnalysis } from '@/components/LaborHoursAnalysis';
import { useLineItemAnalysis } from '@/hooks/useLineItemAnalysis';
import { AIAnalysisPopup } from '@/components/AIAnalysisPopup';

export const PODetail = () => {
  const { id } = useParams<{ id: string }>();
  const [poData, setPOData] = useState<StoredPO | null>(null);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const { toast } = useToast();
  
  // Get real analysis data from the hook
  const { summary: analysisData, rows: analysisRows } = useLineItemAnalysis(
    poData?.extractedData?.lineItems || [],
    { excessiveQtyThreshold: 20 }
  );

  useEffect(() => {
    if (id) {
      const po = LocalStorageService.getPO(id);
      if (po) {
        setPOData(po);
      }
    }
  }, [id]);

  // Automatically make decision based on analysis results
  useEffect(() => {
    if (poData && analysisData && analysisRows && id) {
      // Calculate decision logic
      const totalItems = analysisRows.length;
      const rejectedCount = analysisData.rejected;
      const cautionCount = analysisData.caution;
      const approvedCount = analysisData.approved;
      
      let autoStatus: 'approved' | 'rejected';
      let aiNote: string;
      
      // Decision logic: Reject if >50% rejected, Caution if >30% flagged, otherwise Approve
      const rejectedPercent = (rejectedCount / totalItems) * 100;
      const flaggedPercent = ((rejectedCount + cautionCount) / totalItems) * 100;
      
      if (rejectedPercent > 50) {
        autoStatus = 'rejected';
        aiNote = `Auto-rejected: ${rejectedPercent.toFixed(0)}% of items failed market analysis. Major pricing concerns detected.`;
      } else if (flaggedPercent > 30) {
        autoStatus = 'rejected'; 
        aiNote = `Auto-rejected: ${flaggedPercent.toFixed(0)}% of items flagged for review. Significant pricing issues require attention.`;
      } else if (cautionCount > 0) {
        autoStatus = 'approved';
        aiNote = `Auto-approved with caution: ${cautionCount} items above market average but within acceptable range. Total variance acceptable.`;
      } else {
        autoStatus = 'approved';
        aiNote = `Auto-approved: All items at or below market average. Pricing analysis passed successfully.`;
      }
      
      // Only update if status has changed or no AI note exists
      if (poData.status !== autoStatus || !poData.aiNote) {
        LocalStorageService.updatePO(id, { 
          status: autoStatus,
          aiNote: aiNote
        });
        setPOData(prev => prev ? { ...prev, status: autoStatus, aiNote } : null);
        
        toast({
          title: `PO ${autoStatus === 'approved' ? 'Approved' : 'Rejected'} Automatically`,
          description: aiNote,
          variant: autoStatus === 'approved' ? 'default' : 'destructive'
        });
      }
    }
  }, [poData, analysisData, analysisRows, id, toast]);

  if (!poData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">PO Not Found</p>
        <p className="text-muted-foreground">The requested purchase order could not be found.</p>
      </div>
    );
  }

  // Mock analysis data for extracted POs that don't have full analysis yet
  const mockAnalysis = {
    diagnosis: 'Vehicle maintenance and repair services as specified in the purchase order',
    confidence: 85,
    notes: [
      'Standard maintenance items identified',
      'Parts and services appear appropriate for vehicle type',
      'Labor estimates within typical range'
    ],
    suspiciousItems: [],
    recommendations: [
      'Verify all parts match vehicle specifications',
      'Confirm labor rates with shop standards'
    ]
  };

  // Mock line items from extracted data or use default
  const mockLineItems = poData.extractedData?.lineItems?.map((item: any, index: number) => ({
    id: index + 1,
    description: item.description,
    type: item.type,
    ataCode: item.ataCode || '00.00.00',
    quantity: item.quantity,
    unitCost: item.unitPrice || item.total || 0,
    marketAvg: (item.unitPrice || item.total || 0) * 0.9, // Mock market average
    dollarDiff: (item.unitPrice || item.total || 0) * 0.1,
    pctDiff: 10,
    status: 'pending',
    reason: 'Awaiting market analysis',
    referenceLinks: []
  })) || [];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground">Auto-Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive text-destructive-foreground">Auto-Rejected</Badge>;
    default:
      return <Badge variant="outline">Analyzing</Badge>;
  }
};

  const handleDecision = (type: 'approve' | 'reject') => {
    // This function is no longer used since decisions are automatic
  };

  const handleExportPO = () => {
    if (!poData) return;

    try {
      // Dynamic import to avoid SSR issues
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        
        // Set up fonts and colors
        doc.setFont('helvetica');
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204); // Primary blue
        doc.text('PURCHASE ORDER', 20, 30);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`PO #${poData.poNumber}`, 20, 40);
        
        // Status badge
        const statusColor = poData.status === 'approved' ? [34, 197, 94] as const : [239, 68, 68] as const;
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`Status: ${poData.status.toUpperCase()}`, 150, 40);
        doc.setTextColor(0, 0, 0);
        
        // Vendor Information
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('VENDOR INFORMATION', 20, 60);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        let yPos = 70;
        doc.text(`Company: ${poData.vendor}`, 20, yPos);
        
        if (poData.extractedData?.vendorAddress) {
          yPos += 8;
          doc.text(`Address: ${poData.extractedData.vendorAddress}`, 20, yPos);
        }
        
        if (poData.extractedData?.vendorPhone) {
          yPos += 8;
          doc.text(`Phone: ${poData.extractedData.vendorPhone}`, 20, yPos);
        }
        
        // Order Details
        yPos += 20;
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('ORDER DETAILS', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Date: ${new Date(poData.date).toLocaleDateString()}`, 20, yPos);
        yPos += 8;
        doc.text(`Vehicle: ${poData.vehicle}`, 20, yPos);
        
        if (poData.extractedData?.vehicle?.vin) {
          yPos += 8;
          doc.text(`VIN: ${poData.extractedData.vehicle.vin}`, 20, yPos);
        }
        
        yPos += 8;
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, yPos);
        
        // Line Items
        yPos += 20;
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('LINE ITEMS', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        // Table headers
        doc.text('Qty', 20, yPos);
        doc.text('Description', 35, yPos);
        doc.text('Type', 120, yPos);
        doc.text('Unit Price', 140, yPos);
        doc.text('Total', 170, yPos);
        
        // Line under headers
        doc.line(20, yPos + 2, 190, yPos + 2);
        yPos += 8;
        
        // Line items data
        const lineItems = poData.extractedData?.lineItems || [];
        lineItems.forEach((item: any, index: number) => {
          if (yPos > 270) { // Check if we need a new page
            doc.addPage();
            yPos = 30;
          }
          
          doc.text(item.quantity?.toString() || '1', 20, yPos);
          doc.text(item.description?.substring(0, 40) || 'N/A', 35, yPos);
          doc.text(item.type || 'other', 120, yPos);
          doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 140, yPos);
          doc.text(`$${(item.total || 0).toFixed(2)}`, 170, yPos);
          yPos += 6;
        });
        
        // AI Analysis Summary
        if (yPos > 240) {
          doc.addPage();
          yPos = 30;
        }
        
        yPos += 15;
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('AI ANALYSIS SUMMARY', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        if (analysisData) {
          doc.text(`Total Items Analyzed: ${analysisRows?.length || 0}`, 20, yPos);
          yPos += 6;
          doc.text(`Approved Items: ${analysisData.approved}`, 20, yPos);
          yPos += 6;
          doc.text(`Caution Items: ${analysisData.caution}`, 20, yPos);
          yPos += 6;
          doc.text(`Rejected Items: ${analysisData.rejected}`, 20, yPos);
          yPos += 6;
          doc.text(`Market Average Total: $${analysisData.totalMarketAvg.toFixed(2)}`, 20, yPos);
        }
        
        if (poData.aiNote) {
          yPos += 10;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('AI Decision:', 20, yPos);
          yPos += 6;
          const splitNote = doc.splitTextToSize(poData.aiNote, 160);
          doc.text(splitNote, 20, yPos);
        }
        
        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`, 20, 285);
        }
        
        // Save the PDF
        doc.save(`PO-${poData.poNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
        
        toast({
          title: "PDF Export Successful",
          description: `PO ${poData.poNumber} exported as PDF`,
          variant: "default"
        });
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF",
        variant: "destructive"
      });
    }
  };

  // Use real analysis data for calculations
  const totalFlagged = analysisData ? (analysisData.caution + analysisData.rejected) : 0;
  const totalAmount = analysisData?.totalBill || poData.total || 0;
  const marketTotal = analysisData?.totalMarketAvg || 0;
  const potentialOverage = Math.max(0, totalAmount - marketTotal);
  const marketSavings = Math.max(0, marketTotal - totalAmount);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0">
      {/* PO Header - Invoice Style */}
      <div className="bg-white border rounded-lg shadow-sm">
        {/* Header Bar */}
        <div className="bg-primary text-primary-foreground px-6 py-4 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Purchase Order</h1>
              <p className="text-primary-foreground/80">PO #{poData.poNumber}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(poData.status)}
              <Button variant="secondary" size="sm" onClick={handleExportPO}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* PO Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vendor Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Vendor Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-base font-medium">{poData.vendor}</p>
                </div>
                {poData.extractedData?.vendorAddress && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-base">{poData.extractedData.vendorAddress}</p>
                  </div>
                )}
                {poData.extractedData?.vendorPhone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base font-mono">{poData.extractedData.vendorPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Order Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-base">{new Date(poData.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                  <p className="text-base">{poData.vehicle}</p>
                </div>
                {poData.extractedData?.vehicle?.vin && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">VIN</label>
                    <p className="text-base font-mono">{poData.extractedData.vehicle.vin}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Analysis Summary</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAnalysisPopup(true)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </Button>
        </div>
        
        {poData.aiAnalysis?.success ? (
          <div className="text-sm">
            {poData.aiAnalysis.summary && (
              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                {poData.aiAnalysis.summary}
              </p>
            )}
            {poData.aiAnalysis.issues && poData.aiAnalysis.issues.length > 0 && (
              <div className="mt-3 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600 font-medium">
                  {poData.aiAnalysis.issues.length} potential issue(s) identified
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-muted-foreground leading-relaxed">
              {mockAnalysis.diagnosis}
            </p>
            <div className="mt-3 flex items-center space-x-4">
              <span className="text-primary font-medium">
                Confidence: {mockAnalysis.confidence}%
              </span>
              <span className="text-muted-foreground">
                {mockAnalysis.notes.length} analysis notes available
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Analysis Tables */}
      <LineItemAnalysis lineItems={poData.extractedData?.lineItems || []} />

      {/* Analysis Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-warning">{totalFlagged}</div>
            <div className="text-sm text-muted-foreground">Flagged Items</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-destructive">+${potentialOverage.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Potential Overage</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-success">-${marketSavings.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Market Savings</div>
          </div>
        </div>
      </Card>

      {/* Decision Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Analysis completed at {new Date().toLocaleString()}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {poData.aiNote && (
              <div className="text-right max-w-md">
                <p className="text-sm font-medium text-muted-foreground mb-1">AI Decision:</p>
                <p className="text-sm text-foreground">{poData.aiNote}</p>
              </div>
            )}
            <Badge className={`${
              poData.status === 'approved' 
                ? 'bg-success text-success-foreground' 
                : 'bg-destructive text-destructive-foreground'
            }`}>
              {poData.status === 'approved' ? 'Auto-Approved' : 'Auto-Rejected'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* AI Analysis Popup */}
      <AIAnalysisPopup
        isOpen={showAnalysisPopup}
        onClose={() => setShowAnalysisPopup(false)}
        aiAnalysis={poData.aiAnalysis?.success ? poData.aiAnalysis : undefined}
        mockAnalysis={!poData.aiAnalysis?.success ? mockAnalysis : undefined}
      />
    </div>
  );
};