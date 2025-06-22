import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, TestTube, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { SimpleProviderRequest, AdvancedProviderRequest, TestProviderResponse, DynamicProvider } from "@/types/api";

interface ProviderFormProps {
  onProviderCreated: () => void;
  editingProvider?: DynamicProvider;
  onProviderUpdated?: () => void;
}

// Available platforms with their configurations
const PLATFORM_PRESETS = {
  sendgrid: {
    name: 'SendGrid',
    description: 'Popular email service with reliable delivery',
    authType: 'api-key',
    requiresSecret: false,
    fields: ['apiKey']
  },
  brevo: {
    name: 'Brevo (Sendinblue)',
    description: 'European email marketing platform',
    authType: 'api-key',
    requiresSecret: false,
    fields: ['apiKey']
  },
  mailgun: {
    name: 'Mailgun',
    description: 'Developer-focused email service',
    authType: 'api-key',
    requiresSecret: false,
    fields: ['apiKey']
  },
  postmark: {
    name: 'Postmark',
    description: 'Transactional email service',
    authType: 'api-key',
    requiresSecret: false,
    fields: ['apiKey']
  },
  mailjet: {
    name: 'Mailjet',
    description: 'Email service with API key and secret',
    authType: 'api-key-secret',
    requiresSecret: true,
    fields: ['apiKey', 'apiSecret']
  },
  ses: {
    name: 'Amazon SES',
    description: 'AWS Simple Email Service',
    authType: 'api-key-secret',
    requiresSecret: true,
    fields: ['apiKey', 'apiSecret']
  },
  custom: {
    name: 'Custom Provider',
    description: 'Configure your own email service',
    authType: 'custom',
    requiresSecret: false,
    fields: ['apiKey']
  }
};

export function ProviderForm({ onProviderCreated, editingProvider, onProviderUpdated }: ProviderFormProps) {
  const [isOpen, setIsOpen] = useState(!!editingProvider);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestProviderResponse | null>(null);
  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>('simple');
  const { toast } = useToast();

  // Form state for simple configuration
  const [simpleForm, setSimpleForm] = useState<SimpleProviderRequest>({
    name: '',
    platformId: '',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
  });

  // Form state for advanced configuration
  const [advancedForm, setAdvancedForm] = useState<AdvancedProviderRequest>({
    name: '',
    platformId: 'custom',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
    customConfig: {
      endpoint: '',
      headers: {},
      authentication: {
        headerName: 'Authorization',
        prefix: 'Bearer ',
      }
    }
  });

  // Initialize form with editing data
  useEffect(() => {
    if (editingProvider) {
      setIsOpen(true);
      const provider = editingProvider;
      
      setSimpleForm({
        name: provider.name,
        platformId: provider.platformId,
        apiKey: provider.apiKey,
        apiSecret: provider.apiSecret || '',
        dailyQuota: provider.dailyQuota,
        isActive: provider.isActive,
      });

      setAdvancedForm({
        name: provider.name,
        platformId: provider.platformId,
        apiKey: provider.apiKey,
        apiSecret: provider.apiSecret || '',
        dailyQuota: provider.dailyQuota,
        isActive: provider.isActive,
        customConfig: provider.customConfig || {
          endpoint: '',
          headers: {},
          authentication: {
            headerName: 'Authorization',
            prefix: 'Bearer ',
          }
        }
      });

      // Set config mode based on whether it's a custom provider
      setConfigMode(provider.platformId === 'custom' ? 'advanced' : 'simple');
    }
  }, [editingProvider]);

  const resetForm = () => {
    setSimpleForm({
      name: '',
      platformId: '',
      apiKey: '',
      apiSecret: '',
      dailyQuota: 1000,
      isActive: true,
    });
    setAdvancedForm({
      name: '',
      platformId: 'custom',
      apiKey: '',
      apiSecret: '',
      dailyQuota: 1000,
      isActive: true,
      customConfig: {
        endpoint: '',
        headers: {},
        authentication: {
          headerName: 'Authorization',
          prefix: 'Bearer ',
        }
      }
    });
    setTestResult(null);
    setConfigMode('simple');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!editingProvider) {
      resetForm();
    }
    if (onProviderUpdated) {
      onProviderUpdated();
    }
  };

  const testProvider = async () => {
    try {
      setIsTesting(true);
      const testData = configMode === 'simple' ? simpleForm : advancedForm;
      const response = await apiService.testProviderConfiguration(testData);
      setTestResult(response.data);
      
      if (response.data.isValid) {
        toast({
          title: "Test Successful",
          description: response.data.message,
        });
      } else {
        toast({
          title: "Test Failed",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        isValid: false,
        message: 'Failed to test provider configuration',
        errors: ['Network error or invalid configuration']
      });
      toast({
        title: "Test Failed",
        description: "Failed to test provider configuration",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (editingProvider) {
        // Update existing provider
        const updateData = configMode === 'simple' ? simpleForm : advancedForm;
        await apiService.updateDynamicProvider(editingProvider.id, updateData);
        toast({
          title: "Provider Updated",
          description: "Email provider has been updated successfully",
        });
        onProviderCreated();
        handleClose();
      } else {
        // Create new provider
        if (configMode === 'simple') {
          await apiService.createSimpleProvider(simpleForm);
        } else {
          await apiService.createAdvancedProvider(advancedForm);
        }
        
        toast({
          title: "Provider Created",
          description: "Email provider has been created successfully",
        });
        onProviderCreated();
        handleClose();
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
      toast({
        title: "Error",
        description: "Failed to save email provider",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPreset = PLATFORM_PRESETS[simpleForm.platformId as keyof typeof PLATFORM_PRESETS];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {!editingProvider && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProvider ? 'Edit Email Provider' : 'Add Email Provider'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={configMode} onValueChange={(value) => setConfigMode(value as 'simple' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Setup</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Provider Configuration</CardTitle>
                <CardDescription>
                  Configure a supported email service provider with API credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      placeholder="My SendGrid Provider"
                      value={simpleForm.name}
                      onChange={(e) => setSimpleForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={simpleForm.platformId}
                      onValueChange={(value) => setSimpleForm(prev => ({ ...prev, platformId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{preset.name}</span>
                              {preset.requiresSecret && (
                                <Badge variant="secondary" className="text-xs">
                                  Requires Secret
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedPreset && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedPreset.description}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={simpleForm.apiKey}
                    onChange={(e) => setSimpleForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                {selectedPreset?.requiresSecret && (
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      placeholder="Enter your API secret"
                      value={simpleForm.apiSecret}
                      onChange={(e) => setSimpleForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyQuota">Daily Quota</Label>
                    <Input
                      id="dailyQuota"
                      type="number"
                      min="1"
                      value={simpleForm.dailyQuota}
                      onChange={(e) => setSimpleForm(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="isActive"
                      checked={simpleForm.isActive}
                      onCheckedChange={(checked) => setSimpleForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
                <CardDescription>
                  Configure a custom email service provider with full control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adv-name">Provider Name</Label>
                    <Input
                      id="adv-name"
                      placeholder="My Custom Provider"
                      value={advancedForm.name}
                      onChange={(e) => setAdvancedForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adv-platform">Platform Type</Label>
                    <Select
                      value={advancedForm.platformId}
                      onValueChange={(value) => setAdvancedForm(prev => ({ ...prev, platformId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adv-apiKey">API Key</Label>
                  <Input
                    id="adv-apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={advancedForm.apiKey}
                    onChange={(e) => setAdvancedForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adv-apiSecret">API Secret (Optional)</Label>
                  <Input
                    id="adv-apiSecret"
                    type="password"
                    placeholder="Enter your API secret if required"
                    value={advancedForm.apiSecret}
                    onChange={(e) => setAdvancedForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                  />
                </div>

                {advancedForm.platformId === 'custom' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium">Custom Configuration</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="endpoint">API Endpoint</Label>
                        <Input
                          id="endpoint"
                          placeholder="https://api.example.com/send"
                          value={advancedForm.customConfig?.endpoint || ''}
                          onChange={(e) => setAdvancedForm(prev => ({
                            ...prev,
                            customConfig: {
                              ...prev.customConfig,
                              endpoint: e.target.value
                            }
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="headerName">Auth Header Name</Label>
                          <Input
                            id="headerName"
                            placeholder="Authorization"
                            value={advancedForm.customConfig?.authentication?.headerName || ''}
                            onChange={(e) => setAdvancedForm(prev => ({
                              ...prev,
                              customConfig: {
                                ...prev.customConfig,
                                authentication: {
                                  ...prev.customConfig?.authentication,
                                  headerName: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prefix">Auth Prefix</Label>
                          <Input
                            id="prefix"
                            placeholder="Bearer "
                            value={advancedForm.customConfig?.authentication?.prefix || ''}
                            onChange={(e) => setAdvancedForm(prev => ({
                              ...prev,
                              customConfig: {
                                ...prev.customConfig,
                                authentication: {
                                  ...prev.customConfig?.authentication,
                                  prefix: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adv-dailyQuota">Daily Quota</Label>
                    <Input
                      id="adv-dailyQuota"
                      type="number"
                      min="1"
                      value={advancedForm.dailyQuota}
                      onChange={(e) => setAdvancedForm(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="adv-isActive"
                      checked={advancedForm.isActive}
                      onCheckedChange={(checked) => setAdvancedForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="adv-isActive">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Results */}
        {testResult && (
          <Card className={testResult.isValid ? "border-green-500" : "border-red-500"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {testResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {testResult.isValid ? "Configuration Valid" : "Configuration Invalid"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {testResult.message}
              </p>
              {testResult.errors && testResult.errors.length > 0 && (
                <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
                  {testResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={testProvider}
            disabled={isTesting || isLoading}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Configuration
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || isTesting}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingProvider ? 'Update Provider' : 'Create Provider'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
