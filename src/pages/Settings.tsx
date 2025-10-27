import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import { WarrantyDemo } from '@/components/WarrantyDemo';
import { 
  Settings as SettingsIcon,
  Users,
  DollarSign,
  Bell,
  Shield,
  Database,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

// Mock settings data
const settingsData = {
  approvalThresholds: {
    partPriceDiff: 20,
    laborRateDiff: 15,
    totalAmountLimit: 5000,
    autoApproveUnder: 500
  },
  notifications: {
    emailReports: true,
    flaggedItems: true,
    dailySummary: false,
    approvalReminders: true
  },
  users: [
    { id: 1, name: 'John Manager', email: 'john@fleet.com', role: 'manager', active: true },
    { id: 2, name: 'Sarah Analyst', email: 'sarah@fleet.com', role: 'analyst', active: true },
    { id: 3, name: 'Mike Supervisor', email: 'mike@fleet.com', role: 'manager', active: false }
  ],
  vmrsCodes: [
    { code: '13.10.00', description: 'Brake Rotors', standardHours: 2.5 },
    { code: '13.20.00', description: 'Brake Pads', standardHours: 1.5 },
    { code: '13.30.00', description: 'Brake Fluid', standardHours: 0.5 },
    { code: '01.10.00', description: 'Engine Oil Change', standardHours: 0.75 }
  ]
};

const Settings = () => {
  const [thresholds, setThresholds] = useState(settingsData.approvalThresholds);
  const [notifications, setNotifications] = useState(settingsData.notifications);
  const { toast } = useToast();

  const handleSaveThresholds = () => {
    toast({
      title: "Settings Saved",
      description: "Approval thresholds have been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approval Thresholds */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Approval Thresholds</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partDiff">Part Price Difference (%)</Label>
                <Input
                  id="partDiff"
                  type="number"
                  value={thresholds.partPriceDiff}
                  onChange={(e) => setThresholds(prev => ({ 
                    ...prev, 
                    partPriceDiff: parseInt(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Flag parts priced above market by this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborDiff">Labor Rate Difference (%)</Label>
                <Input
                  id="laborDiff"
                  type="number"
                  value={thresholds.laborRateDiff}
                  onChange={(e) => setThresholds(prev => ({ 
                    ...prev, 
                    laborRateDiff: parseInt(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Flag labor rates above standard by this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalLimit">Total Amount Limit ($)</Label>
                <Input
                  id="totalLimit"
                  type="number"
                  value={thresholds.totalAmountLimit}
                  onChange={(e) => setThresholds(prev => ({ 
                    ...prev, 
                    totalAmountLimit: parseInt(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Require manual approval for POs above this amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApprove">Auto-Approve Under ($)</Label>
                <Input
                  id="autoApprove"
                  type="number"
                  value={thresholds.autoApproveUnder}
                  onChange={(e) => setThresholds(prev => ({ 
                    ...prev, 
                    autoApproveUnder: parseInt(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Automatically approve POs under this amount (if no flags)
                </p>
              </div>

              <Button onClick={handleSaveThresholds} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Thresholds
              </Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Reports</Label>
                  <p className="text-xs text-muted-foreground">
                    Send PDF reports via email after PO decisions
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReports}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailReports: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Flagged Items Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when items are flagged for review
                  </p>
                </div>
                <Switch
                  checked={notifications.flaggedItems}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, flaggedItems: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">
                    Daily email with processing statistics
                  </p>
                </div>
                <Switch
                  checked={notifications.dailySummary}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, dailySummary: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Approval Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Remind about pending PO approvals
                  </p>
                </div>
                <Switch
                  checked={notifications.approvalReminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, approvalReminders: checked }))
                  }
                />
              </div>

              <Button onClick={handleSaveNotifications} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Notifications
              </Button>
            </div>
          </Card>

          {/* User Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">User Management</h2>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="space-y-4">
              {settingsData.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'manager' ? 'default' : 'outline'}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* VMRS/ATA Codes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">VMRS/ATA Codes</h2>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Code
              </Button>
            </div>

            <div className="space-y-3">
              {settingsData.vmrsCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{code.code}</p>
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{code.standardHours}h</p>
                    <p className="text-xs text-muted-foreground">Standard</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Warranty System Demo */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Warranty System Testing</h2>
            </div>
            <WarrantyDemo />
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;