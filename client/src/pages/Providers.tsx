import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw, AlertTriangle, Trash2, Edit, MoreHorizontal, Power, PowerOff } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { DynamicProvider } from "@/types/api";
import { ProviderForm } from "@/components/ProviderForm";

export default function Providers() {
  const [providers, setProviders] = useState<DynamicProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<DynamicProvider | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDynamicProviders();
      
      // Ensure all providers have required numeric properties with defaults
      // Map API response structure to UI expected structure
      const normalizedProviders = (response.data || []).map(provider => ({
        ...provider,
        dailyQuota: provider.dailyQuota || 0,
        remainingToday: provider.remainingToday || 0,
        totalSent: provider.usedToday || provider.totalSent || 0, // API uses 'usedToday'
        successRate: provider.successRate || 95, // Default success rate since API doesn't provide it
        isActive: provider.isActive ?? true,
        config: provider.config || { apiKey: '' },
        createdAt: provider.createdAt || provider.lastResetDate || new Date().toISOString(),
        updatedAt: provider.updatedAt || provider.lastResetDate || new Date().toISOString(),
        lastUsed: provider.lastUsed || provider.lastResetDate
      }));
      
      setProviders(normalizedProviders);
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        title: "Error",
        description: "Failed to load email providers",
        variant: "destructive",
      });
      setProviders([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProvider = async (id: string, isActive: boolean) => {
    try {
      await apiService.updateDynamicProvider(id, { isActive });
      await loadProviders();
      toast({
        title: "Provider Updated",
        description: `Provider has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Failed to toggle provider:', error);
      toast({
        title: "Error",
        description: "Failed to update provider status",
        variant: "destructive",
      });
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await apiService.deleteDynamicProvider(id);
      await loadProviders();
      toast({
        title: "Provider Deleted",
        description: "Email provider has been deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast({
        title: "Error",
        description: "Failed to delete provider",
        variant: "destructive",
      });
    }
  };

  const getProviderIcon = (type: string) => {
    const iconProps = { className: "h-8 w-8 text-muted-foreground" };
    
    switch (type.toLowerCase()) {
      case 'sendgrid':
        return <div {...iconProps} style={{ backgroundColor: '#1A82E2', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>SG</div>;
      case 'brevo':
        return <div {...iconProps} style={{ backgroundColor: '#0B8F47', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>BR</div>;
      case 'mailgun':
        return <div {...iconProps} style={{ backgroundColor: '#F56500', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>MG</div>;
      case 'aws-ses':
        return <div {...iconProps} style={{ backgroundColor: '#FF9900', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>AWS</div>;
      case 'postmark':
        return <div {...iconProps} style={{ backgroundColor: '#FFCC00', color: 'black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>PM</div>;
      default:
        return <Settings {...iconProps} />;
    }
  };

  const getProviderStatus = (provider: DynamicProvider): 'online' | 'offline' | 'error' => {
    if (!provider || provider.isActive === false) return 'offline';
    // You could add more sophisticated status logic here based on recent activity, errors, etc.
    const remainingToday = provider.remainingToday || 0;
    return remainingToday > 0 ? 'online' : 'error';
  };

  // Calculate summary stats with safe defaults
  const totalQuotaUsed = providers.reduce((sum, p) => {
    const dailyQuota = p.dailyQuota || 0;
    const remainingToday = p.remainingToday || 0;
    return sum + Math.max(0, dailyQuota - remainingToday);
  }, 0);
  
  const totalQuotaLimit = providers.reduce((sum, p) => sum + (p.dailyQuota || 0), 0);
  
  const averageSuccessRate = providers.length 
    ? Math.round(providers.reduce((sum, p) => sum + (p.successRate || 0), 0) / providers.length)
    : 0;
    
  const activeProviders = providers.filter(p => 
    (p.isActive === true || p.isActive === undefined) && 
    getProviderStatus(p) === 'online'
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Provider Management</h1>
            <p className="text-muted-foreground">Manage your email service providers</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Provider Management</h1>
          <p className="text-muted-foreground">Manage your dynamic email service providers</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadProviders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <ProviderForm onProviderCreated={loadProviders} />
        </div>
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
                <p className="text-2xl font-bold">{activeProviders}</p>
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
          // Safe calculations with fallbacks
          const dailyQuota = provider.dailyQuota || 0;
          const remainingToday = provider.remainingToday || 0;
          const quotaUsed = Math.max(0, dailyQuota - remainingToday);
          const quotaPercentage = dailyQuota > 0 ? (quotaUsed / dailyQuota) * 100 : 0;
          const isQuotaWarning = quotaPercentage >= 80;
          const status = getProviderStatus(provider);

          return (
            <Card key={provider.id} className={isQuotaWarning ? "border-yellow-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.type)}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.name || 'Unnamed Provider'}
                        <Badge variant={(provider.type || '').toLowerCase() === 'custom' ? 'secondary' : 'default'}>
                          {provider.type || 'unknown'}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={status} />
                        {isQuotaWarning && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.isActive}
                      onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingProvider(provider)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleProvider(provider.id, !provider.isActive)}
                        >
                          {provider.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{provider.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProvider(provider.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quota Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quota Usage</span>
                    <span>{quotaUsed.toLocaleString()} / {dailyQuota.toLocaleString()}</span>
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
                    <p className="text-muted-foreground">Total Sent</p>
                    <p className="font-medium">{(provider.totalSent || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{provider.successRate || 0}%</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Last Used</p>
                  <p className="font-medium">
                    {provider.lastUsed 
                      ? new Date(provider.lastUsed).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(provider.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Provider-specific info */}
                {provider.config?.endpoint && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-xs truncate" title={provider.config.endpoint}>
                      {provider.config.endpoint}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Provider Dialog */}
      {editingProvider && (
        <ProviderForm
          key={editingProvider.id}
          editingProvider={editingProvider}
          onProviderCreated={loadProviders}
          onProviderUpdated={() => {
            loadProviders();
            setEditingProvider(undefined);
          }}
        />
      )}

      {providers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first email service provider to start sending emails. You can configure popular services like SendGrid, Brevo, or create custom integrations.
            </p>
            <ProviderForm onProviderCreated={loadProviders} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

