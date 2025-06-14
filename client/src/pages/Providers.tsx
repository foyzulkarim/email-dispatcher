
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { Settings, RefreshCw, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock data
const mockProviders = [
  {
    id: "1",
    name: "SendGrid",
    status: "online" as const,
    enabled: true,
    quotaUsed: 8420,
    quotaTotal: 10000,
    emailsSentToday: 1847,
    successRate: 99.5,
    lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "AWS SES",
    status: "online" as const,
    enabled: true,
    quotaUsed: 1250,
    quotaTotal: 5000,
    emailsSentToday: 892,
    successRate: 98.8,
    lastActivity: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Mailgun",
    status: "offline" as const,
    enabled: false,
    quotaUsed: 0,
    quotaTotal: 2000,
    emailsSentToday: 0,
    successRate: 97.2,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Postmark",
    status: "online" as const,
    enabled: true,
    quotaUsed: 1850,
    quotaTotal: 2000,
    emailsSentToday: 324,
    successRate: 99.1,
    lastActivity: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

export default function Providers() {
  const [providers, setProviders] = useState(mockProviders);

  const toggleProvider = (id: string, enabled: boolean) => {
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, enabled } : p
    ));
  };

  const resetQuota = (id: string) => {
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, quotaUsed: 0 } : p
    ));
  };

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProviderIcon = (name: string) => {
    return <Settings className="h-8 w-8 text-muted-foreground" />;
  };

  const totalQuotaUsed = providers.reduce((sum, p) => sum + p.quotaUsed, 0);
  const totalQuotaLimit = providers.reduce((sum, p) => sum + p.quotaTotal, 0);
  const averageSuccessRate = providers.length 
    ? Math.round(providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Provider Management</h1>
          <p className="text-muted-foreground">Manage your email service providers</p>
        </div>
        <Button size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quota Usage</p>
                <p className="text-2xl font-bold">{totalQuotaUsed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">of {totalQuotaLimit.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <Progress 
              value={totalQuotaLimit > 0 ? (totalQuotaUsed / totalQuotaLimit) * 100 : 0} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">
                  {providers.filter(p => p.enabled && p.status === 'online').length}
                </p>
                <p className="text-sm text-muted-foreground">of {providers.length} total</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Success Rate</p>
                <p className="text-2xl font-bold">{averageSuccessRate}%</p>
                <p className="text-sm text-muted-foreground">across all providers</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="text-blue-600 font-bold text-sm">{averageSuccessRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const quotaPercentage = (provider.quotaUsed / provider.quotaTotal) * 100;
          const isQuotaWarning = quotaPercentage >= 80;

          return (
            <Card key={provider.id} className={isQuotaWarning ? "border-yellow-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.name)}
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={provider.status} />
                        {isQuotaWarning && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(enabled) => toggleProvider(provider.id, enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quota Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quota Usage</span>
                    <span>{provider.quotaUsed.toLocaleString()} / {provider.quotaTotal.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={quotaPercentage} 
                    className="h-2"
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {Math.round(quotaPercentage)}%
                  </div>
                  {isQuotaWarning && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Quota usage is high
                    </p>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent Today</p>
                    <p className="font-medium">{provider.emailsSentToday.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{provider.successRate}%</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Last Activity</p>
                  <p className="font-medium">
                    {new Date(provider.lastActivity).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Reset Quota
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Quota</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset the quota for {provider.name}? 
                          This will set the used quota back to 0.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetQuota(provider.id)}
                        >
                          Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first email service provider to start sending emails.
            </p>
            <Button>Add Provider</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
