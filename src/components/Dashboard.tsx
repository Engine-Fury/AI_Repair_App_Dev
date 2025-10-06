import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Upload
} from 'lucide-react';
import { LocalStorageService, type StoredPO, type POStats } from '@/services/LocalStorageService';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground">Auto-Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive text-destructive-foreground">Auto-Rejected</Badge>;
    case 'pending':
      return <Badge className="bg-warning text-warning-foreground">Analyzing</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const Dashboard = () => {
  const [stats, setStats] = useState<POStats>({ totalPOs: 0, approved: 0, rejected: 0, pending: 0 });
  const [recentPOs, setRecentPOs] = useState<StoredPO[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const loadedStats = LocalStorageService.getStats();
    const loadedPOs = LocalStorageService.getRecentPOs(5);
    
    setStats(loadedStats);
    setRecentPOs(loadedPOs);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* KPI Cards Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Fleet PO analysis overview</p>
        </div>
        <Link to="/upload">
          <Button className="flex items-center space-x-2 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            <span>Upload New PO</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total POs</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPOs}</p>
            </div>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-xl sm:text-2xl font-bold text-success">{stats.approved}</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-xl sm:text-2xl font-bold text-destructive">{stats.rejected}</p>
            </div>
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Recent POs Table */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Purchase Orders</h2>
          <Link to="/reports">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
          </Link>
        </div>

        {recentPOs.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">PO Number</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Vendor</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">Vehicle</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Status</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Total</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden md:table-cell">Date</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">AI Note</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPOs.map((po) => (
                    <tr key={po.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <Link to={`/po/${po.id}`} className="text-primary hover:underline font-medium text-xs sm:text-sm">
                          {po.poNumber}
                        </Link>
                        {/* Mobile: Show vendor below PO number */}
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          {po.vendor}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 text-foreground text-xs sm:text-sm hidden sm:table-cell">
                        {po.vendor}
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 text-muted-foreground text-xs hidden lg:table-cell">
                        {po.vehicle}
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">{getStatusBadge(po.status)}</td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                      <div className="text-foreground font-medium text-xs sm:text-sm">
                        ${po.total > 0 ? po.total.toFixed(2) : (po.extractedData?.totalAmount?.toFixed(2) || '0.00')}
                      </div>
                        {po.savings && po.savings > 0 && (
                          <div className="text-success text-xs">Saved ${po.savings.toFixed(2)}</div>
                        )}
                        {po.flaggedItems && po.flaggedItems > 0 && (
                          <div className="text-warning text-xs">{po.flaggedItems} flagged</div>
                        )}
                        {/* Mobile: Show date below total */}
                        <div className="md:hidden text-xs text-muted-foreground mt-1">
                          {new Date(po.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                        {new Date(po.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 text-muted-foreground text-xs hidden lg:table-cell max-w-xs">
                        <div className="truncate" title={po.aiNote}>
                          {po.aiNote || 'Processing...'}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <Link to={`/po/${po.id}`}>
                          <Button variant="outline" size="sm" className="text-xs px-2 py-1 sm:px-3 sm:py-2">
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium text-foreground mb-2">No Purchase Orders Yet</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">Upload your first PO to get started with analysis</p>
            <Link to="/upload">
              <Button className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Upload First PO
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};