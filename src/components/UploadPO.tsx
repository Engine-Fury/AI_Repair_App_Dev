import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Truck, DollarSign, Eye, Brain, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OCRService } from '@/services/OCRService';
import { POParser, type POData, type VehicleInfo, type LineItem } from '@/services/POParser';
import { LocalStorageService } from '@/services/LocalStorageService';
import { OpenAIService, type AIAnalysisResult } from '@/services/OpenAIService';
import { SerpAPIService, type PriceComparisonResult } from '@/services/SerpAPIService';

interface UploadStatus {
  step: 'idle' | 'uploading' | 'processing' | 'parsing' | 'analyzing' | 'pricing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export const UploadPO = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    step: 'idle',
    progress: 0,
    message: ''
  });
  
  const [extractedData, setExtractedData] = useState<POData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [priceComparison, setPriceComparison] = useState<PriceComparisonResult[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('image/'))) {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processDocument = async () => {
    if (!file) return;

    try {
      // Step 1: Upload
      setUploadStatus({
        step: 'uploading',
        progress: 10,
        message: 'Uploading file...'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: OCR Processing
      setUploadStatus({
        step: 'processing',
        progress: 20,
        message: 'Extracting text with OCR...'
      });

      const ocrResult = await OCRService.extractText(file);
      
      if (!ocrResult.success || !ocrResult.text) {
        throw new Error(ocrResult.error || 'OCR extraction failed');
      }

      setRawText(ocrResult.text);

      // Step 3: Parse extracted text
      setUploadStatus({
        step: 'parsing',
        progress: 40,
        message: 'Parsing PO information...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const parseResult = POParser.parse(ocrResult.text);
      
      // If OCR setup is required, show helpful message instead of processing
      if (!parseResult.success && parseResult.message) {
        setUploadStatus({
          step: 'error',
          progress: 0,
          message: parseResult.message
        });
        
        toast({
          title: "OCR Configuration Required",
          description: "Real document processing requires OCR service setup. This demo shows the workflow structure.",
          variant: "destructive",
        });
        return;
      }
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse PO data');
      }

      setExtractedData(parseResult.data);

      // Step 4: AI Analysis
      setUploadStatus({
        step: 'analyzing',
        progress: 60,
        message: 'Analyzing PO with AI...'
      });

      const analysis = await OpenAIService.analyzePO(parseResult.data, ocrResult.text);
      if (analysis.success) {
        setAiAnalysis(analysis);
      } else {
        console.warn('AI analysis failed:', analysis.error);
      }

      // Step 5: Market Price Verification
      if (parseResult.data.lineItems.length > 0) {
        setUploadStatus({
          step: 'pricing',
          progress: 80,
          message: 'Verifying market prices...'
        });

        const priceResults = await SerpAPIService.compareLinePrices(parseResult.data.lineItems.slice(0, 3)); // Limit to first 3 items for demo
        setPriceComparison(priceResults);
      }

      // Step 6: Complete
      setUploadStatus({
        step: 'complete',
        progress: 100,
        message: 'Document processing complete!'
      });

      toast({
        title: "PO Processing Complete",
        description: "All information has been successfully extracted and analyzed.",
      });

    } catch (error) {
      console.error('Document processing failed:', error);
      setUploadStatus({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Processing failed'
      });
      
      toast({
        title: "Processing Failed",
        description: "Failed to process the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PO file to upload.",
        variant: "destructive",
      });
      return;
    }

    await processDocument();
  };

  const handleViewDetails = () => {
    if (extractedData) {
      // Save PO to localStorage
      const vehicleString = extractedData.vehicle.year && extractedData.vehicle.make && extractedData.vehicle.model
        ? `${extractedData.vehicle.year} ${extractedData.vehicle.make} ${extractedData.vehicle.model}`
        : 'Unknown Vehicle';

      const savedPO = LocalStorageService.savePO({
        poNumber: extractedData.poNumber || 'Unknown',
        vendor: extractedData.vendor || 'Unknown Vendor',
        vehicle: vehicleString,
        status: 'pending',
        date: extractedData.date || new Date().toISOString().split('T')[0],
        total: extractedData.totalAmount || 0,
        extractedData,
        rawText,
        aiAnalysis,
        priceComparison
      });

      navigate(`/po/${savedPO.id}`);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Upload Purchase Order</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload a PO image or PDF for automated analysis and approval workflow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* File Upload Area */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Purchase Order Document</h2>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-success bg-success/5'
                : 'border-border hover:border-primary'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drag and drop your PO here
                    </p>
                    <p className="text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, JPG, PNG (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Processing Status */}
        {uploadStatus.step !== 'idle' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {uploadStatus.step === 'complete' ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : uploadStatus.step === 'error' ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                )}
                <div>
                  <p className="font-medium text-foreground">{uploadStatus.message}</p>
                  {(uploadStatus.step === 'processing' || uploadStatus.step === 'parsing') && (
                    <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                  )}
                </div>
              </div>
              <Progress value={uploadStatus.progress} className="w-full" />
            </div>
          </Card>
        )}

        {/* Extracted Information Display */}
        {extractedData && (
          <div className="space-y-6">
            {/* PO Header Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Extracted PO Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {extractedData.poNumber && (
                  <div>
                    <Label className="text-muted-foreground">PO Number</Label>
                    <p className="font-medium">{extractedData.poNumber}</p>
                  </div>
                )}
                {extractedData.date && (
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{extractedData.date}</p>
                  </div>
                )}
                {extractedData.vendor && (
                  <div>
                    <Label className="text-muted-foreground">Vendor</Label>
                    <p className="font-medium">{extractedData.vendor}</p>
                  </div>
                )}
                {extractedData.vendorAddress && (
                  <div>
                    <Label className="text-muted-foreground">Vendor Address</Label>
                    <p className="font-medium">{extractedData.vendorAddress}</p>
                  </div>
                )}
                {extractedData.vendorPhone && (
                  <div>
                    <Label className="text-muted-foreground">Vendor Phone</Label>
                    <p className="font-medium">{extractedData.vendorPhone}</p>
                  </div>
                )}
                {extractedData.totalAmount && (
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-medium text-lg">${extractedData.totalAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Vehicle Information */}
            {Object.values(extractedData.vehicle).some(v => v) && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Extracted Vehicle Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {extractedData.vehicle.vin && (
                    <div>
                      <Label className="text-muted-foreground">VIN</Label>
                      <p className="font-mono font-medium">{extractedData.vehicle.vin}</p>
                    </div>
                  )}
                  {extractedData.vehicle.year && (
                    <div>
                      <Label className="text-muted-foreground">Year</Label>
                      <p className="font-medium">{extractedData.vehicle.year}</p>
                    </div>
                  )}
                  {extractedData.vehicle.make && (
                    <div>
                      <Label className="text-muted-foreground">Make</Label>
                      <p className="font-medium">{extractedData.vehicle.make}</p>
                    </div>
                  )}
                  {extractedData.vehicle.model && (
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p className="font-medium">{extractedData.vehicle.model}</p>
                    </div>
                  )}
                  {extractedData.vehicle.mileage && (
                    <div>
                      <Label className="text-muted-foreground">Mileage</Label>
                      <p className="font-medium">{extractedData.vehicle.mileage} miles</p>
                    </div>
                  )}
                  {extractedData.vehicle.licensePlate && (
                    <div>
                      <Label className="text-muted-foreground">License Plate</Label>
                      <p className="font-medium">{extractedData.vehicle.licensePlate}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Line Items */}
            {extractedData.lineItems.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Extracted Line Items</h2>
                  </div>
                  <Badge variant="outline">{extractedData.lineItems.length} items</Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Part/Labor #</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Qty</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Unit Price</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedData.lineItems.map((item, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3">{item.description}</td>
                          <td className="py-3">
                            <Badge variant={item.type === 'part' ? 'default' : item.type === 'labor' ? 'secondary' : 'outline'}>
                              {item.type}
                            </Badge>
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {item.partNumber || item.laborCode || '-'}
                          </td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-right">
                            {item.unitPrice > 0 ? `$${item.unitPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {extractedData.subtotal && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">${extractedData.subtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {extractedData.tax && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">${extractedData.tax.toFixed(2)}</span>
                      </div>
                    )}
                    {extractedData.totalAmount && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">${extractedData.totalAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* AI Analysis Results - Brief Summary */}
            {aiAnalysis && aiAnalysis.success && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Quick Analysis Preview</h2>
                  <Badge variant="outline">View detailed analysis after upload</Badge>
                </div>
                
                <div className="space-y-3">
                  {aiAnalysis.summary && (
                    <div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">{aiAnalysis.summary}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>✓ Vehicle condition assessed</span>
                    <span>✓ Repair analysis completed</span>
                    <span>✓ Cost evaluation done</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Market Price Comparison */}
            {priceComparison.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Market Price Analysis</h2>
                  </div>
                  <Badge variant="outline">{priceComparison.length} items analyzed</Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Item</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Your Price</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Market Avg</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Variance</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceComparison.map((comparison, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 max-w-xs truncate">{comparison.item}</td>
                          <td className="py-3 text-right font-medium">${comparison.currentPrice.toFixed(2)}</td>
                          <td className="py-3 text-right">
                            {comparison.marketPrice ? `$${comparison.marketPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="py-3 text-right">
                            {comparison.variance ? (
                              <span className={comparison.variance > 20 ? 'text-red-600' : comparison.variance > 0 ? 'text-amber-600' : 'text-green-600'}>
                                {comparison.variance > 0 ? '+' : ''}{comparison.variance}%
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="py-3 text-center">
                            <Badge 
                              variant={
                                comparison.status === 'good' ? 'default' : 
                                comparison.status === 'caution' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {comparison.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>* Market prices are estimates based on current online pricing data</p>
                  <p>* Price analysis is limited to first 3 items for performance</p>
                </div>
              </Card>
            )}
            {rawText && (
              <Card className="p-6">
                <details className="space-y-4">
                  <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
                    View Raw Extracted Text
                  </summary>
                  <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {rawText}
                    </pre>
                  </div>
                </details>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 px-4 sm:px-0">
          <Button
            type="submit"
            disabled={!file || ['processing', 'uploading', 'parsing', 'analyzing', 'pricing'].includes(uploadStatus.step)}
            className="px-6 sm:px-8 w-full sm:w-auto"
          >
            {['processing', 'uploading', 'parsing', 'analyzing', 'pricing'].includes(uploadStatus.step)
              ? 'Processing...'
              : extractedData
              ? 'Re-analyze Document'
              : 'Extract & Analyze PO'}
          </Button>
          
          {extractedData && uploadStatus.step === 'complete' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleViewDetails}
              className="px-6 sm:px-8 w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Full Analysis</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};