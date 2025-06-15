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
import { ProviderPreset, SimpleProviderRequest, AdvancedProviderRequest, TestProviderResponse, DynamicProvider } from "@/types/api";

interface ProviderFormProps {
  onProviderCreated: () => void;
  editingProvider?: DynamicProvider;
  onProviderUpdated?: () => void;
}

export function ProviderForm({ onProviderCreated, editingProvider, onProviderUpdated }: ProviderFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestProviderResponse | null>(null);
  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>('simple');
  const { toast } = useToast();

  // Form state for simple configuration
  const [simpleForm, setSimpleForm] = useState<SimpleProviderRequest>({
    name: '',
    type: '',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
  });

  // Form state for advanced configuration
  const [advancedForm, setAdvancedForm] = useState<AdvancedProviderRequest>({
    name: '',
    type: 'custom',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
    endpoint: '',
    method: 'POST',
    headers: {},
    authentication: {
      type: 'api-key',
      headerName: 'X-API-Key',
    },
    payloadTemplate: {},
    fieldMappings: {},
  });

  // Load presets on component mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingProvider) {
      const provider = editingProvider;
      setSimpleForm({
        name: provider.name,
        type: provider.type,
        apiKey: provider.config.apiKey,
        apiSecret: provider.config.apiSecret || '',
        dailyQuota: provider.dailyQuota,
        isActive: provider.isActive,
      });

      setAdvancedForm({
        name: provider.name,
        type: provider.type,
        apiKey: provider.config.apiKey,
        apiSecret: provider.config.apiSecret || '',
        dailyQuota: provider.dailyQuota,
        isActive: provider.isActive,
        endpoint: provider.config.endpoint || '',
        method: provider.config.method || 'POST',
        headers: provider.config.headers || {},
        authentication: provider.config.authentication || { type: 'api-key', headerName: 'X-API-Key' },
        payloadTemplate: provider.config.payloadTemplate || {},
        fieldMappings: provider.config.fieldMappings || {},
      });

      // Determine config mode based on whether it has custom endpoint
      setConfigMode(provider.config.endpoint ? 'advanced' : 'simple');
    }
  }, [editingProvider]);

  const loadPresets = async () => {
    try {
      const response = await apiService.getProviderPresets();
      setPresets(response.data);
    } catch (error) {
      console.error('Failed to load presets:', error);
      toast({
        title: "Error",
        description: "Failed to load provider presets",
        variant: "destructive",
      });
    }
  };

  const handlePresetSelect = (presetType: string) => {
    const preset = presets.find(p => p.type === presetType);
    if (preset) {
      setSimpleForm(prev => ({
        ...prev,
        type: preset.type,
        // Apply default config if available
        ...preset.defaultConfig,
      }));
    }
  };

  const testConfiguration = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const testData = configMode === 'simple' ? simpleForm : {
        name: advancedForm.name,
        type: advancedForm.type,
        apiKey: advancedForm.apiKey,
        apiSecret: advancedForm.apiSecret,
        dailyQuota: advancedForm.dailyQuota,
        isActive: advancedForm.isActive,
      };

      const response = await apiService.testProviderConfiguration(testData);
      setTestResult(response.data);

      toast({
        title: response.data.isValid ? "Configuration Valid" : "Configuration Invalid",
        description: response.data.message,
        variant: response.data.isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test failed:', error);
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
    setIsLoading(true);

    try {
      if (editingProvider) {
        // Update existing provider
        const updateData = configMode === 'simple' ? simpleForm : {
          name: advancedForm.name,
          type: advancedForm.type,
          apiKey: advancedForm.apiKey,
          apiSecret: advancedForm.apiSecret,
          dailyQuota: advancedForm.dailyQuota,
          isActive: advancedForm.isActive,
        };

        await apiService.updateDynamicProvider(editingProvider.id, updateData);
        toast({
          title: "Provider Updated",
          description: `${updateData.name} has been updated successfully`,
        });
        onProviderUpdated?.();
      } else {
        // Create new provider
        const response = configMode === 'simple' 
          ? await apiService.createSimpleProvider(simpleForm)
          : await apiService.createAdvancedProvider(advancedForm);

        toast({
          title: "Provider Created",
          description: `${response.data.name} has been created successfully`,
        });
        onProviderCreated();
      }

      // Reset form
      setSimpleForm({
        name: '',
        type: '',
        apiKey: '',
        apiSecret: '',
        dailyQuota: 1000,
        isActive: true,
      });
      setAdvancedForm({
        name: '',
        type: 'custom',
        apiKey: '',
        apiSecret: '',
        dailyQuota: 1000,
        isActive: true,
        endpoint: '',
        method: 'POST',
        headers: {},
        authentication: { type: 'api-key', headerName: 'X-API-Key' },
        payloadTemplate: {},
        fieldMappings: {},
      });
      setTestResult(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Submit failed:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingProvider ? 'update' : 'create'} provider`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimpleForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Provider Name</Label>
          <Input
            id="name"
            value={simpleForm.name}
            onChange={(e) => setSimpleForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Email Provider"
          />
        </div>
        <div>
          <Label htmlFor="type">Provider Type</Label>
          <Select value={simpleForm.type} onValueChange={(value) => {
            setSimpleForm(prev => ({ ...prev, type: value }));
            handlePresetSelect(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider type" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.type} value={preset.type}>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={simpleForm.apiKey}
          onChange={(e) => setSimpleForm(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Enter your API key"
        />
      </div>

      {(simpleForm.type === 'mailgun' || simpleForm.type === 'aws-ses') && (
        <div>
          <Label htmlFor="apiSecret">API Secret / Domain</Label>
          <Input
            id="apiSecret"
            value={simpleForm.apiSecret}
            onChange={(e) => setSimpleForm(prev => ({ ...prev, apiSecret: e.target.value }))}
            placeholder="Enter API secret or domain"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dailyQuota">Daily Quota</Label>
          <Input
            id="dailyQuota"
            type="number"
            value={simpleForm.dailyQuota}
            onChange={(e) => setSimpleForm(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
            placeholder="1000"
          />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Switch
            id="isActive"
            checked={simpleForm.isActive}
            onCheckedChange={(checked) => setSimpleForm(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedForm = () => (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adv-name">Provider Name</Label>
              <Input
                id="adv-name"
                value={advancedForm.name}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Custom Email Provider"
              />
            </div>
            <div>
              <Label htmlFor="adv-type">Provider Type</Label>
              <Input
                id="adv-type"
                value={advancedForm.type}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, type: e.target.value }))}
                placeholder="custom"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adv-apiKey">API Key</Label>
              <Input
                id="adv-apiKey"
                type="password"
                value={advancedForm.apiKey}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
              />
            </div>
            <div>
              <Label htmlFor="adv-apiSecret">API Secret (Optional)</Label>
              <Input
                id="adv-apiSecret"
                value={advancedForm.apiSecret}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                placeholder="Enter API secret if required"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adv-dailyQuota">Daily Quota</Label>
              <Input
                id="adv-dailyQuota"
                type="number"
                value={advancedForm.dailyQuota}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
                placeholder="1000"
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
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

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                value={advancedForm.endpoint}
                onChange={(e) => setAdvancedForm(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1/send"
              />
            </div>
            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select value={advancedForm.method} onValueChange={(value) => setAdvancedForm(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="headers">HTTP Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={JSON.stringify(advancedForm.headers, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  setAdvancedForm(prev => ({ ...prev, headers }));
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder={JSON.stringify({ 'Content-Type': 'application/json', 'Accept': 'application/json' }, null, 2)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select 
                value={advancedForm.authentication?.type} 
                onValueChange={(value: 'api-key' | 'basic' | 'bearer') => 
                  setAdvancedForm(prev => ({ 
                    ...prev, 
                    authentication: { ...prev.authentication!, type: value } 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="header-name">Header Name</Label>
              <Input
                id="header-name"
                value={advancedForm.authentication?.headerName || ''}
                onChange={(e) => setAdvancedForm(prev => ({ 
                  ...prev, 
                  authentication: { ...prev.authentication!, headerName: e.target.value } 
                }))}
                placeholder="X-API-Key"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payload Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payload Template</CardTitle>
          <CardDescription>Define how email data maps to your API payload</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="payload-template">Payload Template (JSON)</Label>
            <Textarea
              id="payload-template"
              value={JSON.stringify(advancedForm.payloadTemplate, null, 2)}
              onChange={(e) => {
                try {
                  const payloadTemplate = JSON.parse(e.target.value);
                  setAdvancedForm(prev => ({ ...prev, payloadTemplate }));
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder={JSON.stringify({
                from: '{{sender.email}}',
                to: '{{recipients.0.email}}',
                subject: '{{subject}}',
                html: '{{htmlContent}}',
                text: '{{textContent}}'
              }, null, 2)}
              rows={8}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {editingProvider ? 'Edit Provider' : 'Add Provider'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProvider ? 'Edit Email Provider' : 'Add New Email Provider'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={configMode} onValueChange={(value) => setConfigMode(value as 'simple' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Configuration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Provider Setup</CardTitle>
                <CardDescription>
                  Configure a provider using built-in presets for popular email services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSimpleForm()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {renderAdvancedForm()}
          </TabsContent>
        </Tabs>

        {/* Test Results */}
        {testResult && (
          <Card className={`border-2 ${testResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                {testResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${testResult.isValid ? 'text-green-900' : 'text-red-900'}`}>
                  {testResult.isValid ? 'Configuration Valid' : 'Configuration Invalid'}
                </span>
              </div>
              <p className={`text-sm ${testResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
              {testResult.errors && testResult.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-red-700">Errors:</div>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {testResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {testResult.generatedPayload && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-green-700">Generated Payload Preview:</div>
                  <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                    {JSON.stringify(testResult.generatedPayload, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={testConfiguration}
            disabled={isTesting || !((configMode === 'simple' && simpleForm.name && simpleForm.type && simpleForm.apiKey) || 
                                     (configMode === 'advanced' && advancedForm.name && advancedForm.endpoint && advancedForm.apiKey))}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Configuration
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !((configMode === 'simple' && simpleForm.name && simpleForm.type && simpleForm.apiKey) || 
                                      (configMode === 'advanced' && advancedForm.name && advancedForm.endpoint && advancedForm.apiKey))}
            >
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
