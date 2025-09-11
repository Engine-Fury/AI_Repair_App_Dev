import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';
import { Download, Search, Filter, FileText, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LocalStorageService, type StoredPO, type POStats } from '@/services/LocalStorageService';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>;
    case 'pending':
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [allPOs, setAllPOs] = useState<StoredPO[]>([]);
  const [stats, setStats] = useState<POStats>({ totalPOs: 0, approved: 0, rejected: 0, pending: 0 });

  useEffect(() => {
    // Load data from localStorage
    const loadedPOs = LocalStorageService.getAllPOs();
    const loadedStats = LocalStorageService.getStats();
    
    setAllPOs(loadedPOs);
    setStats(loadedStats);
  }, []);

  const filteredReports = allPOs.filter(report => {
    const matchesSearch = 
      report.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalSavings = allPOs
    .filter(r => r.status === 'approved' && r.savings)
    .reduce((sum, r) => sum + (r.savings || 0), 0);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Purchase Order Reports</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View and manage all PO analysis results</p>
          </div>
          <Button className="flex items-center space-x-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            <span>Export All</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Processed</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPOs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.approved}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Savings</p>
                <p className="text-xl sm:text-2xl font-bold text-success">${totalSavings.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search POs, vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center space-x-2 w-full lg:w-auto">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <span className="sm:hidden">Filters</span>
            </Button>
          </div>
        </Card>

        {/* Reports Table */}
        <Card className="p-4 sm:p-6">
          {filteredReports.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">PO Number</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Vendor</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">Vehicle</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Status</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Total</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden md:table-cell">Savings</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden md:table-cell">Flagged</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">Date</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-2 sm:py-4 sm:px-4">
                          <Link to={`/po/${report.id}`} className="text-primary hover:underline font-medium text-xs sm:text-sm">
                            {report.poNumber}
                          </Link>
                          {/* Mobile: Show vendor and date below PO number */}
                          <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                            <div>{report.vendor}</div>
                            <div>{new Date(report.date).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-foreground text-xs sm:text-sm hidden sm:table-cell">
                          {report.vendor}
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-muted-foreground text-xs hidden lg:table-cell">
                          {report.vehicle}
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4">{getStatusBadge(report.status)}</td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-right">
                          <div className="font-medium text-xs sm:text-sm">
                            ${report.total.toFixed(2)}
                          </div>
                          {/* Mobile: Show savings and flagged below total */}
                          <div className="md:hidden text-xs space-y-1 mt-1">
                            {report.savings && report.savings > 0 ? (
                              <div className="text-success">+${report.savings.toFixed(2)}</div>
                            ) : (
                              <div className="text-muted-foreground">-</div>
                            )}
                            {report.flaggedItems && report.flaggedItems > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {report.flaggedItems}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-right hidden md:table-cell">
                          {report.savings && report.savings > 0 ? (
                            <span className="text-success font-medium text-xs sm:text-sm">
                              +${report.savings.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-center hidden md:table-cell">
                          {report.flaggedItems && report.flaggedItems > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {report.flaggedItems}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4 text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 sm:py-4 sm:px-4">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link to={`/po/${report.id}`}>
                              <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto">
                                <span className="hidden sm:inline">View</span>
                                <span className="sm:hidden">View</span>
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto">
                              <Download className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              {allPOs.length === 0 ? (
                <>
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-base sm:text-lg font-medium text-foreground mb-2">No Purchase Orders</p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Upload your first PO to start generating reports</p>
                  <Link to="/upload">
                    <Button className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PO
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm sm:text-base text-muted-foreground">No reports match your current filters.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;