import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LaborAnalysisResult } from '../services/LaborHoursService';

interface Props {
  laborAnalysis: LaborAnalysisResult[];
  loading?: boolean;
}

export const LaborHoursAnalysis: React.FC<Props> = ({ laborAnalysis, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Labor Hours Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!laborAnalysis.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Labor Hours Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No labor items found for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reasonable':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Reasonable</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">High</Badge>;
      case 'excessive':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Excessive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalBilledHours = laborAnalysis.reduce((sum, item) => sum + item.billedHours, 0);
  const totalStandardHours = laborAnalysis.reduce((sum, item) => sum + ((item.standardMinHours + item.standardMaxHours) / 2), 0);
  const totalVariance = totalStandardHours > 0 ? ((totalBilledHours - totalStandardHours) / totalStandardHours) * 100 : 0;

  const reasonableCount = laborAnalysis.filter(item => item.status === 'reasonable').length;
  const highCount = laborAnalysis.filter(item => item.status === 'high').length;
  const excessiveCount = laborAnalysis.filter(item => item.status === 'excessive').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Labor Hours Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          {laborAnalysis.length} labor items analyzed against industry standards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Billed Hours</p>
            <p className="text-2xl font-bold">{totalBilledHours.toFixed(1)}</p>
          </div>
          <div className="bg-background rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Standard Hours</p>
            <p className="text-2xl font-bold">{totalStandardHours.toFixed(1)}</p>
          </div>
          <div className="bg-background rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Hours Variance</p>
            <p className={`text-2xl font-bold ${totalVariance > 20 ? 'text-red-600' : totalVariance > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}%
            </p>
          </div>
          <div className="bg-background rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Status Summary</p>
            <div className="flex gap-1 text-xs">
              <span className="text-green-600">{reasonableCount}✓</span>
              <span className="text-yellow-600">{highCount}⚠</span>
              <span className="text-red-600">{excessiveCount}✗</span>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Component</th>
                <th className="text-right p-3 font-medium">Billed Hours</th>
                <th className="text-right p-3 font-medium">Standard Range</th>
                <th className="text-right p-3 font-medium">Variance</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Confidence</th>
                <th className="text-center p-3 font-medium">VMRS Code</th>
              </tr>
            </thead>
            <tbody>
              {laborAnalysis.map((item, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="font-medium">{item.component}</div>
                  </td>
                  <td className="p-3 text-right font-mono">
                    {item.billedHours.toFixed(1)}h
                  </td>
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {item.standardMinHours.toFixed(1)} - {item.standardMaxHours.toFixed(1)}h
                  </td>
                  <td className={`p-3 text-right font-mono ${
                    item.variance > 20 ? 'text-red-600' : 
                    item.variance > 10 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-3 text-center font-mono text-muted-foreground">
                    {item.confidence.toFixed(0)}%
                  </td>
                  <td className="p-3 text-center font-mono text-xs text-muted-foreground">
                    {item.vmrsCode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {laborAnalysis.some(item => item.confidence < 70) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Some items have low confidence matching. 
              Manual review recommended for items with confidence below 70%.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};