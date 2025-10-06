import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle2, AlertCircle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OCRService } from "@/services/OCRService";
import { POParser } from "@/services/POParser";
import { OpenAIService, AIAnalysisResult } from "@/services/OpenAIService";
import { SerpAPIService } from "@/services/SerpAPIService";
import { LineItemAnalysis } from "@/components/LineItemAnalysis";

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
  const [poData, setPoData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [priceComparison, setPriceComparison] = useState<any>(null);
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

      // Stage 5: Market Price Verification
      setStatus({ stage: 'verifying', message: 'Verifying market prices...', progress: 85 });
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            PO Analysis Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your purchase order and get instant AI-powered analysis with market price verification
          </p>
        </div>

        {/* Upload Section */}
        {status.stage === 'idle' && (
          <Card className="max-w-3xl mx-auto shadow-2xl border-primary/20 animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Upload className="h-6 w-6 text-primary" />
                Upload Purchase Order
              </CardTitle>
              <CardDescription className="text-base">
                Drag and drop your PO document or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer group relative overflow-hidden
                  ${isDragging 
                    ? 'border-primary bg-primary/10 scale-105' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'}`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {selectedFile ? (
                    <div className="animate-fade-in">
                      <div className="inline-block p-4 bg-primary/10 rounded-2xl mb-4">
                        <FileText className="h-16 w-16 text-primary" />
                      </div>
                      <p className="font-semibold text-xl mb-2">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <Button 
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          processDocument();
                        }}
                        className="px-8 shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Analyze Document
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="inline-block p-4 bg-muted/50 rounded-2xl mb-4 group-hover:bg-primary/10 transition-colors">
                        <Upload className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xl font-medium mb-2">Drop your PO document here</p>
                      <p className="text-sm text-muted-foreground">
                        Supports images and PDF files • Maximum 20MB
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
            </CardContent>
          </Card>
        )}

        {/* Processing Section */}
        {status.stage !== 'idle' && status.stage !== 'complete' && (
          <Card className="max-w-2xl mx-auto shadow-2xl border-primary/20 animate-scale-in">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Processing Your Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Progress value={status.progress} className="w-full h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{status.progress}%</span>
                  <span>Complete</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-6 bg-primary/5 rounded-lg">
                <div className="animate-spin">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-center text-lg font-medium">{status.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {status.stage === 'complete' && poData && (
          <div className="space-y-8 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                    ${poData.totalAmount?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Line Items</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    {poData.lineItems?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">PO Number</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                    {poData.poNumber || 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Analysis */}
            <Card className="shadow-2xl border-primary/20">
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50">
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    AI Analysis
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    PO Details
                  </TabsTrigger>
                  <TabsTrigger value="lineitems" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Line Items
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="analysis" className="space-y-6 p-6">
                {aiAnalysis?.success && (
                  <>
                    <Card className="border-primary/20 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                          Analysis Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p>
                      </CardContent>
                    </Card>

                    {aiAnalysis.vehicleCondition && (
                      <Card className="border-blue-500/20 shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            </div>
                            Vehicle Condition
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">{aiAnalysis.vehicleCondition}</p>
                        </CardContent>
                      </Card>
                    )}

                    {aiAnalysis.repairAnalysis && (
                      <Card className="border-purple-500/20 shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            Repair Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">{aiAnalysis.repairAnalysis}</p>
                        </CardContent>
                      </Card>
                    )}

                    {aiAnalysis.costAnalysis && (
                      <Card className="border-green-500/20 shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            Cost Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">{aiAnalysis.costAnalysis}</p>
                        </CardContent>
                      </Card>
                    )}

                    {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
                      <Card className="border-amber-500/20 shadow-md bg-amber-50/50 dark:bg-amber-950/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            Issues & Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {aiAnalysis.issues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                                <Badge variant="outline" className="mt-0.5 border-amber-500 text-amber-600">!</Badge>
                                <span className="text-sm leading-relaxed">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6 p-6">
                <Card className="border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      Purchase Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">PO Number</p>
                        <p className="font-medium">{poData.poNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{poData.date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vendor</p>
                        <p className="font-medium">{poData.vendor || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vendor Phone</p>
                        <p className="font-medium">{poData.vendorPhone || 'N/A'}</p>
                      </div>
                      {poData.vendorAddress && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Vendor Address</p>
                          <p className="font-medium">{poData.vendorAddress}</p>
                        </div>
                      )}
                      {poData.authorizedBy && (
                        <div>
                          <p className="text-sm text-muted-foreground">Authorized By</p>
                          <p className="font-medium">{poData.authorizedBy}</p>
                        </div>
                      )}
                      {poData.terms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Terms</p>
                          <p className="font-medium">{poData.terms}</p>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3">Financial Summary</h3>
                      <div className="space-y-2">
                        {poData.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">${poData.subtotal.toFixed(2)}</span>
                          </div>
                        )}
                        {poData.tax && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-medium">${poData.tax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total:</span>
                          <span>${poData.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    {poData.vehicle && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3">Vehicle Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {poData.vehicle.vin && (
                            <div>
                              <p className="text-sm text-muted-foreground">VIN</p>
                              <p className="font-medium">{poData.vehicle.vin}</p>
                            </div>
                          )}
                          {(poData.vehicle.year || poData.vehicle.make || poData.vehicle.model) && (
                            <div>
                              <p className="text-sm text-muted-foreground">Vehicle</p>
                              <p className="font-medium">
                                {[poData.vehicle.year, poData.vehicle.make, poData.vehicle.model]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>
                            </div>
                          )}
                          {poData.vehicle.mileage && (
                            <div>
                              <p className="text-sm text-muted-foreground">Mileage</p>
                              <p className="font-medium">{poData.vehicle.mileage}</p>
                            </div>
                          )}
                          {poData.vehicle.licensePlate && (
                            <div>
                              <p className="text-sm text-muted-foreground">License Plate</p>
                              <p className="font-medium">{poData.vehicle.licensePlate}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineitems" className="p-6">
                {poData.lineItems && poData.lineItems.length > 0 && (
                  <LineItemAnalysis lineItems={poData.lineItems} />
                )}
              </TabsContent>
              </Tabs>
            </Card>

            {/* Reset Button */}
            <div className="text-center pt-8">
              <Button 
                onClick={resetAnalyzer} 
                size="lg"
                variant="outline"
                className="px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Upload className="mr-2 h-5 w-5" />
                Analyze Another PO
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
