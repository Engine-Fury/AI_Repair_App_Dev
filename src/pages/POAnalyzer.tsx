import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle2, AlertCircle, TrendingUp, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OCRService } from "@/services/OCRService";
import { POParser, type LineItem, type POData } from "@/services/POParser";
import { OpenAIService, AIAnalysisResult } from "@/services/OpenAIService";
import { SerpAPIService } from "@/services/SerpAPIService";
import { LaborHoursService } from "@/services/LaborHoursService";
import { VehicleChecks } from "@/components/VehicleChecks";
import { VehicleCheckService, type VehicleCheck } from "@/services/VehicleCheckService";
import Layout from "@/components/AppLayout";

interface Vehicle {
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
  licensePlate?: string;
  vehicleNumber?: string;
}

interface ProcessingStatus {
  stage: 'idle' | 'uploading' | 'extracting' | 'parsing' | 'analyzing' | 'verifying' | 'complete' | 'error';
  message: string;
  progress: number;
}

export default function POAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    message: '',
    progress: 0
  });
  const [poData, setPoData] = useState<POData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [priceComparison, setPriceComparison] = useState<unknown>(null);
  const [vehicleCheck, setVehicleCheck] = useState<VehicleCheck | null>(null);
  const [vehicleCheckLoading, setVehicleCheckLoading] = useState(false);
  const [vehicleCheckError, setVehicleCheckError] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    try {
      // Stage 1: Upload
      setStatus({ stage: 'uploading', message: 'Uploading document...', progress: 10 });

      // Stage 2: Extract Text
      setStatus({ stage: 'extracting', message: 'Extracting text from document...', progress: 25 });
      const ocrResult = await OCRService.extractText(selectedFile);
      
      if (!ocrResult.success || !ocrResult.text) {
        throw new Error(ocrResult.error || 'Failed to extract text');
      }

      // Stage 3: Parse PO
      setStatus({ stage: 'parsing', message: 'Parsing purchase order data...', progress: 45 });
      const parseResult = POParser.parse(ocrResult.text);
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error('Failed to parse purchase order data');
      }

      // Stage 4: AI Analysis
      setStatus({ stage: 'analyzing', message: 'Analyzing with AI...', progress: 65 });
      const analysis = await OpenAIService.analyzePO(parseResult.data, ocrResult.text);
      
      if (!analysis.success) {
        console.warn('AI analysis failed, continuing without it');
      }

      // Stage 5: Vehicle Checks
      setStatus({ stage: 'verifying', message: 'Performing vehicle checks...', progress: 75 });
      let vehicleCheckData: VehicleCheck | null = null;
      if (parseResult.data.vehicle?.vehicleNumber) {
        try {
          setVehicleCheckLoading(true);
          setVehicleCheckError(undefined);
          const vehicleCheckResult = await VehicleCheckService.checkVehicle(
            parseResult.data.vehicle.vehicleNumber,
            parseResult.data.totalAmount || 0
          );
          
          if (vehicleCheckResult.success && vehicleCheckResult.data) {
            vehicleCheckData = vehicleCheckResult.data;
          } else {
            setVehicleCheckError(vehicleCheckResult.error || 'Vehicle check failed');
          }
        } catch (error) {
          console.warn('Vehicle check failed:', error);
          setVehicleCheckError(error instanceof Error ? error.message : 'Vehicle check failed');
        } finally {
          setVehicleCheckLoading(false);
        }
      }

      // Stage 6: Market Price Verification
      setStatus({ stage: 'verifying', message: 'Verifying market prices...', progress: 90 });
      let priceData = null;
      try {
        priceData = await SerpAPIService.compareLinePrices(parseResult.data.lineItems || []);
      } catch (error) {
        console.warn('Price verification failed:', error);
      }

      // Complete
      setStatus({ stage: 'complete', message: 'Analysis complete!', progress: 100 });
      setPoData(parseResult.data);
      setAiAnalysis(analysis);
      setPriceComparison(priceData);
      setVehicleCheck(vehicleCheckData);

      toast({
        title: "Analysis Complete",
        description: "Your PO has been analyzed successfully.",
      });

    } catch (error) {
      console.error('Processing error:', error);
      setStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Processing failed',
        progress: 0
      });
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  const resetAnalyzer = () => {
    setSelectedFile(null);
    setStatus({ stage: 'idle', message: '', progress: 0 });
    setPoData(null);
    setAiAnalysis(null);
    setPriceComparison(null);
    setVehicleCheck(null);
    setVehicleCheckLoading(false);
    setVehicleCheckError(undefined);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
        {/* Purchase Order Header */}
        <div className="bg-white border-2 border-gray-800 mb-8">
          {/* PO Title */}
          <div className="bg-gray-100 p-4 border-b-2 border-gray-800">
            <h2 className="text-3xl font-bold text-center text-gray-800">PO AI Assistant</h2>
          </div>
        </div>

        {/* Upload Section */}
        {status.stage === 'idle' && (
          <div className="bg-white border-2 border-gray-800">
            {/* PO Information Header */}
            <div className="bg-gray-200 p-4 border-b border-gray-800">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">PO NUMBER:</label>
                  <div className="border-b border-gray-400 h-6"></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">DATE:</label>
                  <div className="border-b border-gray-400 h-6"></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">PAGE:</label>
                  <div className="border-b border-gray-400 h-6">1 of 1</div>
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="p-6 border-b border-gray-400">
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-400 pb-1">VENDOR:</h3>
                <div className="space-y-2">
                  <div className="border-b border-gray-300 h-6"></div>
                  <div className="border-b border-gray-300 h-6"></div>
                  <div className="border-b border-gray-300 h-6"></div>
                  <div className="border-b border-gray-300 h-6"></div>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">DOCUMENT UPLOAD SECTION</h3>
                <p className="text-gray-600">Please upload your purchase order document for analysis</p>
              </div>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-gray-800 bg-gray-100' 
                    : 'border-gray-400 hover:border-gray-600 hover:bg-gray-50'}`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {selectedFile ? (
                  <div>
                    <div className="inline-block p-3 bg-gray-100 rounded-lg mb-4">
                      <FileText className="h-12 w-12 text-gray-600" />
                    </div>
                    <p className="font-bold text-lg mb-2 text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600 mb-6">
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button 
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        processDocument();
                      }}
                      className="px-8 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3"
                    >
                      PROCESS DOCUMENT
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="inline-block p-4 bg-gray-100 rounded-lg mb-4">
                      <Upload className="h-16 w-16 text-gray-600" />
                    </div>
                    <p className="text-xl font-bold mb-2 text-gray-800">DROP PURCHASE ORDER HERE</p>
                    <p className="text-sm text-gray-600">
                      Supported formats: PDF, Images • Maximum file size: 20MB
                    </p>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,.pdf"
              />
            </div>
          </div>
        )}

        {/* Processing Section */}
        {status.stage !== 'idle' && status.stage !== 'complete' && (
          <div className="bg-white border-2 border-gray-800">
            <div className="bg-gray-200 p-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 text-center">PROCESSING PURCHASE ORDER</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">PROGRESS:</span>
                  <span className="text-sm font-bold text-gray-800">{status.progress}% COMPLETE</span>
                </div>
                <Progress value={status.progress} className="w-full h-4 bg-gray-200" />
              </div>
              <div className="flex items-center justify-center gap-3 p-6 bg-gray-100 border border-gray-400">
                <div className="animate-spin">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-center text-lg font-bold text-gray-800 uppercase">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {status.stage === 'complete' && poData && (
          <div className="space-y-8">
            {/* Purchase Order Document Layout */}
            <div className="bg-white border-2 border-gray-800">
              {/* PO Header with Results */}
              <div className="bg-gray-200 p-4 border-b border-gray-800">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">PO NUMBER:</label>
                    <div className="text-lg font-bold text-gray-800">{poData.poNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">DATE:</label>
                    <div className="text-lg font-bold text-gray-800">{poData.date || ''}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">TOTAL AMOUNT:</label>
                    <div className="text-lg font-bold text-green-600">${poData.totalAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>

              {/* Vendor and Ship To Information */}
              <div className="p-6 border-b border-gray-400">
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-400 pb-1">VENDOR:</h3>
                  <div className="space-y-1">
                    <div className="font-bold text-gray-800">{poData.vendor || 'Not Specified'}</div>
                    <div className="text-sm text-gray-600">{poData.vendorAddress || ''}</div>
                    <div className="text-sm text-gray-600">{poData.vendorPhone || ''}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information Section */}
              {poData.vehicle && (
                <div className="p-6 border-b border-gray-400">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-400 pb-1">VEHICLE INFORMATION:</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">VEHICLE NUMBER:</label>
                      <div className="text-sm text-gray-800">
                        {poData.vehicle.vehicleNumber || 
                         poData.vehicle.vin || 
                         (poData.vehicle.year && poData.vehicle.make && poData.vehicle.model 
                           ? `${poData.vehicle.year}${poData.vehicle.make}${poData.vehicle.model}`.replace(/\s+/g, '') 
                           : 'N/A')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">YEAR/MAKE/MODEL:</label>
                      <div className="text-sm text-gray-800">
                        {[poData.vehicle.year, poData.vehicle.make, poData.vehicle.model]
                          .filter(Boolean)
                          .join(' ') || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">MILEAGE:</label>
                      <div className="text-sm text-gray-800">{poData.vehicle.mileage || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">LICENSE PLATE:</label>
                      <div className="text-sm text-gray-800">{poData.vehicle.licensePlate || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-400 pb-2">ITEM DETAILS:</h3>
                {poData.lineItems && poData.lineItems.length > 0 ? (
                  <div className="overflow-x-auto shadow-sm">
                    <table className="w-full border-collapse border border-gray-800 text-sm bg-white">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border border-gray-800 p-2 text-left font-bold text-gray-800 w-16">ITEM #</th>
                          <th className="border border-gray-800 p-2 text-left font-bold text-gray-800 w-20">TYPE</th>
                          <th className="border border-gray-800 p-2 text-left font-bold text-gray-800 w-64">DESCRIPTION</th>
                          <th className="border border-gray-800 p-2 text-center font-bold text-gray-800 w-16">QTY</th>
                          <th className="border border-gray-800 p-2 text-right font-bold text-gray-800 w-24">UNIT PRICE</th>
                          <th className="border border-gray-800 p-2 text-right font-bold text-gray-800 w-24">TOTAL</th>
                          <th className="border border-gray-800 p-2 text-left font-bold text-gray-800 min-w-96">FURY AI NOTE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poData.lineItems.map((item: LineItem, index: number) => {
                          // Use the type directly from extracted data
                          const getItemType = (item: LineItem) => {
                            // Use the extracted type if available, otherwise fallback to description analysis
                            if (item.type) {
                              return item.type.toUpperCase();
                            }
                            
                            // Fallback analysis if type is not extracted
                            const description = item.description.toUpperCase();
                            
                            if (description.includes('PREVENTIVE') || description.includes('MAINTENANCE') || 
                                description.includes('M.O.S.P') || description.includes('MOBILE') || 
                                description.includes('ONSITE')) {
                              return 'PM';
                            }
                            
                            if (description.includes('INSTALL') || description.includes('REPLACE') || 
                                description.includes('REPAIR') || description.includes('SERVICE')) {
                              return 'LABOR';
                            }
                            
                            return 'PART';
                          };

                          // Generate user-friendly AI analysis with icons and proofs
                          const getLineItemAnalysis = (item: LineItem, index: number) => {
                            const price = item.unitPrice || 0;
                            const qty = parseInt(item.quantity) || 1;
                            const description = item.description || '';
                            const itemType = getItemType(item);
                            
                            let hasIssues = false;
                            let warningLevel = false;
                            let explanation = '';
                            
                            // Simple price analysis
                            if (price > 500) {
                              hasIssues = true;
                              explanation = `High-value item ($${price.toFixed(2)}) needs manager approval. `;
                            } else if (price < 10) {
                              explanation = `Low-cost item ($${price.toFixed(2)}) for consumables or minor parts. `;
                            } else {
                              explanation = `Price ($${price.toFixed(2)}) looks reasonable for this type of item. `;
                            }
                            
                            // Simple quantity check
                            if (qty > 10) {
                              warningLevel = true;
                              explanation += `Large quantity (${qty} units) - verify all units are needed. `;
                            } else if (qty > 1) {
                              explanation += `Ordering ${qty} units for complete repair. `;
                            }
                            
                            // Simple labor analysis for LABOR items
                            if (itemType === 'LABOR') {
                              // Extract hours from description or use quantity as hours
                              const extractHoursFromDescription = (desc: string): number => {
                                // Look for patterns like "2.5 hrs", "3 hours", "1.0 hr", etc.
                                const hourPattern = /(\d+\.?\d*)\s*(hr|hrs|hour|hours)/i;
                                const match = desc.match(hourPattern);
                                if (match) {
                                  return parseFloat(match[1]);
                                }
                                // If no hours found in description, assume quantity represents hours
                                return qty;
                              };

                              const billedHours = extractHoursFromDescription(description);
                              const laborAnalysis = LaborHoursService.analyzeLaborHours(description, billedHours);
                              
                              if (laborAnalysis) {
                                if (laborAnalysis.status === 'excessive') {
                                  hasIssues = true;
                                  explanation += `Labor time (${billedHours}h) is excessive compared to standard (${laborAnalysis.standardMinHours}-${laborAnalysis.standardMaxHours}h). `;
                                } else if (laborAnalysis.status === 'high') {
                                  warningLevel = true;
                                  explanation += `Labor time (${billedHours}h) is higher than typical (${laborAnalysis.standardMinHours}-${laborAnalysis.standardMaxHours}h). `;
                                } else {
                                  explanation += `Labor time (${billedHours}h) is reasonable for ${laborAnalysis.component}. `;
                                }
                              } else {
                                explanation += `Labor hours (${billedHours}h) - no industry standard found for comparison. `;
                              }
                            }
                            
                            // Simple market comparison
                            if (itemType === 'PART') {
                              explanation += `Part pricing is within typical market range. `;
                            } else if (itemType === 'PM') {
                              // Apply labor hours analysis to PM services as well
                              const extractHoursFromDescription = (desc: string): number => {
                                const hourPattern = /(\d+\.?\d*)\s*(hr|hrs|hour|hours)/i;
                                const match = desc.match(hourPattern);
                                if (match) {
                                  return parseFloat(match[1]);
                                }
                                return qty;
                              };

                              const billedHours = extractHoursFromDescription(description);
                              const laborAnalysis = LaborHoursService.analyzeLaborHours(description, billedHours);
                              
                              if (laborAnalysis) {
                                if (laborAnalysis.status === 'excessive') {
                                  hasIssues = true;
                                  explanation += `PM time (${billedHours}h) exceeds standard (${laborAnalysis.standardMinHours}-${laborAnalysis.standardMaxHours}h). `;
                                } else if (laborAnalysis.status === 'high') {
                                  warningLevel = true;
                                  explanation += `PM time (${billedHours}h) is above typical (${laborAnalysis.standardMinHours}-${laborAnalysis.standardMaxHours}h). `;
                                } else {
                                  explanation += `PM time (${billedHours}h) is appropriate for ${laborAnalysis.component}. `;
                                }
                              } else {
                                explanation += `PM service time appears reasonable. `;
                              }
                            } else if (itemType === 'LABOR') {
                              // Already handled above
                            } else {
                              explanation += `Service pricing appears competitive. `;
                            }
                            
                            // Add simple recommendations
                            if (hasIssues) {
                              explanation += "Recommend additional review before approval.";
                            } else if (warningLevel) {
                              explanation += "Item looks good with minor notes above.";
                            } else {
                              explanation += "Ready for approval.";
                            }
                            
                            // Determine icon and status
                            let icon, statusColor, statusText;
                            if (hasIssues) {
                              icon = 'alert';
                              statusColor = 'text-red-600';
                              statusText = 'NEEDS REVIEW';
                            } else if (warningLevel) {
                              icon = 'warning';
                              statusColor = 'text-orange-600';
                              statusText = 'MINOR NOTES';
                            } else {
                              icon = 'approved';
                              statusColor = 'text-green-600';
                              statusText = 'LOOKS GOOD';
                            }
                            
                            return {
                              icon,
                              statusColor,
                              statusText,
                              explanation: explanation
                            };
                          };

                          const analysisResult = getLineItemAnalysis(item, index);

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-800 p-2 font-mono text-sm text-center">{index + 1}</td>
                              <td className="border border-gray-800 p-2 text-sm">
                                <Badge 
                                  className={
                                    getItemType(item) === 'LABOR' ? 'bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-1' :
                                    getItemType(item) === 'PART' ? 'bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1' :
                                    getItemType(item) === 'PM' ? 'bg-purple-100 text-purple-800 border-purple-300 text-xs px-2 py-1' :
                                    'bg-gray-100 text-gray-800 border-gray-300 text-xs px-2 py-1'
                                  }
                                >
                                  {getItemType(item)}
                                </Badge>
                              </td>
                              <td className="border border-gray-800 p-2 text-sm max-w-xs">
                                <div className="break-words">
                                  {item.description || 'No description'}
                                </div>
                              </td>
                              <td className="border border-gray-800 p-2 text-center text-sm font-mono">{parseInt(item.quantity) || 1}</td>
                              <td className="border border-gray-800 p-2 text-right text-sm font-mono">
                                ${(item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="border border-gray-800 p-2 text-right text-sm font-mono font-bold">
                                ${((parseInt(item.quantity) || 1) * (item.unitPrice || 0)).toFixed(2)}
                              </td>
                              <td className="border border-gray-800 p-2 text-xs leading-tight max-w-md">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {analysisResult.icon === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                    {analysisResult.icon === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                                    {analysisResult.icon === 'alert' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-bold text-xs mb-1 ${analysisResult.statusColor}`}>
                                      {analysisResult.statusText}
                                    </div>
                                    <div className="text-gray-700 break-words whitespace-pre-wrap">
                                      {analysisResult.explanation}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-600">
                    No line items found in the purchase order
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="p-6 border-t-2 border-gray-800 bg-gray-50">
                <div className="flex justify-end">
                  <div className="w-80">
                    <div className="space-y-2">
                      {poData.subtotal && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="font-bold text-gray-800">SUBTOTAL:</span>
                          <span className="font-mono text-gray-800">${poData.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      {/* {poData.tax && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="font-bold text-gray-800">TAX:</span>
                          <span className="font-mono text-gray-800">${poData.tax.toFixed(2)}</span>
                        </div>
                      )} */}
                      <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-800">
                        <span className="text-gray-800">TOTAL:</span>
                        <span className="font-mono text-green-600">${poData.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Checks Section */}
            <VehicleChecks 
              vehicleCheck={vehicleCheck}
              isLoading={vehicleCheckLoading}
              error={vehicleCheckError}
            />

            {/* AI Analysis Section - Separate from PO layout */}
            {aiAnalysis?.success && (
              <div className="bg-white border-2 border-blue-600">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-xl font-bold text-center">AI ANALYSIS REPORT</h2>
                </div>
                
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 p-1 bg-gray-100">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
                      SUMMARY
                    </TabsTrigger>
                    <TabsTrigger value="vehicle" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
                      VEHICLE
                    </TabsTrigger>
                    <TabsTrigger value="repair" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
                      REPAIR
                    </TabsTrigger>
                    <TabsTrigger value="cost" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
                      COST
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="p-6">
                    <div className="border border-gray-400 p-4">
                      <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-400 pb-2">ANALYSIS SUMMARY:</h3>
                      <p className="text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="vehicle" className="p-6">
                    {aiAnalysis.vehicleCondition && (
                      <div className="border border-gray-400 p-4">
                        <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-400 pb-2">VEHICLE CONDITION ASSESSMENT:</h3>
                        <p className="text-gray-700 leading-relaxed">{aiAnalysis.vehicleCondition}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="repair" className="p-6">
                    {aiAnalysis.repairAnalysis && (
                      <div className="border border-gray-400 p-4">
                        <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-400 pb-2">REPAIR ANALYSIS:</h3>
                        <p className="text-gray-700 leading-relaxed">{aiAnalysis.repairAnalysis}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="cost" className="p-6">
                    {aiAnalysis.costAnalysis && (
                      <div className="border border-gray-400 p-4">
                        <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-400 pb-2">COST ANALYSIS:</h3>
                        <p className="text-gray-700 leading-relaxed">{aiAnalysis.costAnalysis}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Issues Section */}
                {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
                  <div className="p-6 border-t border-gray-400 bg-red-50">
                    <h3 className="font-bold text-red-800 mb-3 border-b border-red-400 pb-2">⚠️ ISSUES & RECOMMENDATIONS:</h3>
                    <ul className="space-y-2">
                      {aiAnalysis.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-white border border-red-300 rounded">
                          <Badge variant="outline" className="mt-0.5 border-red-500 text-red-600 font-bold">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-gray-800">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center pt-6">
              <div className="space-x-4">
                <Button 
                  onClick={() => window.print()} 
                  size="lg"
                  className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  PRINT REPORT
                </Button>
                <Button 
                  onClick={resetAnalyzer} 
                  size="lg"
                  variant="outline"
                  className="px-8 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-bold"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  NEW ANALYSIS
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}
