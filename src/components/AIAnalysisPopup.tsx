import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface AIAnalysisData {
  success: boolean;
  summary?: string;
  vehicleCondition?: string;
  repairAnalysis?: string;
  issues?: string[];
  costAnalysis?: string;
}

interface MockAnalysisData {
  diagnosis: string;
  confidence: number;
  notes: string[];
  suspiciousItems: string[];
  recommendations: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  aiAnalysis?: AIAnalysisData;
  mockAnalysis?: MockAnalysisData;
}

export const AIAnalysisPopup: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  aiAnalysis, 
  mockAnalysis 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Complete AI Analysis</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {aiAnalysis?.success ? (
            <>
              {aiAnalysis.summary && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Summary</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {aiAnalysis.summary}
                  </p>
                </div>
              )}
              
              {aiAnalysis.vehicleCondition && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Vehicle Condition</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {aiAnalysis.vehicleCondition}
                  </p>
                </div>
              )}
              
              {aiAnalysis.repairAnalysis && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Repair Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {aiAnalysis.repairAnalysis}
                  </p>
                </div>
              )}
              
              {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg text-amber-600">Potential Issues</h3>
                  <ul className="space-y-2">
                    {aiAnalysis.issues.map((issue: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground text-base">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiAnalysis.costAnalysis && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Cost Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {aiAnalysis.costAnalysis}
                  </p>
                </div>
              )}
            </>
          ) : mockAnalysis ? (
            <>
              <div>
                <h3 className="font-semibold mb-3 text-lg">Analysis Summary</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {mockAnalysis.diagnosis}
                </p>
                <div className="mt-2">
                  <span className="text-sm font-medium text-primary">
                    Confidence: {mockAnalysis.confidence}%
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-lg">Analysis Notes</h3>
                <ul className="space-y-2">
                  {mockAnalysis.notes.map((note, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground text-base">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {mockAnalysis.suspiciousItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg text-amber-600">Suspicious Items</h3>
                  <ul className="space-y-2">
                    {mockAnalysis.suspiciousItems.map((item, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3 text-lg">Recommendations</h3>
                <ul className="space-y-2">
                  {mockAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground text-base">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No analysis data available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};