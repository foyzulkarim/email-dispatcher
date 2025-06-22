import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Upload, 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Mail,
  Users,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { SubmitEmailRequest, DynamicProvider } from "@/types/api";

export default function SubmitJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<DynamicProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<SubmitEmailRequest>({
    subject: '',
    body: '',
    recipients: [],
    userProviderId: '',
    metadata: {}
  });

  // UI state
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientMode, setRecipientMode] = useState<'manual' | 'bulk'>('manual');
  const [bulkRecipients, setBulkRecipients] = useState('');

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoadingProviders(true);
      const response = await apiService.getDynamicProviders(true); // Only active providers
      const activeProviders = (response.data || []).filter(p => p.isActive);
      setProviders(activeProviders);
      
      // Auto-select first provider if available
      if (activeProviders.length > 0 && !formData.userProviderId) {
        setFormData(prev => ({ ...prev, userProviderId: activeProviders[0].id }));
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        title: "Error",
        description: "Failed to load email providers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const addRecipient = () => {
    if (!recipientInput.trim()) return;
    
    const email = recipientInput.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates
    if (formData.recipients.includes(email)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the recipient list",
        variant: "destructive",
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, email]
    }));
    setRecipientInput('');
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const processBulkRecipients = () => {
    if (!bulkRecipients.trim()) return;
    
    const emails = bulkRecipients
      .split(/[\n,;]/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    
    emails.forEach(email => {
      if (emailRegex.test(email)) {
        if (!formData.recipients.includes(email) && !validEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });
    
    if (validEmails.length > 0) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, ...validEmails]
      }));
      setBulkRecipients('');
      toast({
        title: "Recipients Added",
        description: `Added ${validEmails.length} valid email addresses`,
      });
    }
    
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Emails Found",
        description: `${invalidEmails.length} invalid email addresses were skipped`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.body.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter email content",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.userProviderId) {
      toast({
        title: "No Provider Selected",
        description: "Please select an email provider",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiService.submitEmailJob(formData);
      
      toast({
        title: "Email Job Submitted",
        description: `Job ${response.jobId} has been queued for processing`,
      });
      
      // Reset form
      setFormData({
        subject: '',
        body: '',
        recipients: [],
        userProviderId: providers.length > 0 ? providers[0].id : '',
        metadata: {}
      });
      setBulkRecipients('');
      setRecipientInput('');
      
    } catch (error) {
      console.error('Failed to submit job:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit email job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === formData.userProviderId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Send Email Campaign</h1>
          <p className="text-muted-foreground">Create and send email campaigns to your recipients</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formData.recipients.length} recipients
          </Badge>
          {selectedProvider && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              {selectedProvider.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter your email subject..."
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Email Content</Label>
                <Textarea
                  id="body"
                  placeholder="Enter your email content..."
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={12}
                />
                <p className="text-xs text-muted-foreground">
                  You can use HTML formatting in your email content
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients ({formData.recipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={recipientMode} onValueChange={(value) => setRecipientMode(value as 'manual' | 'bulk')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Add Manually</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address..."
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="bulk" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste email addresses here (one per line, or comma/semicolon separated)..."
                      value={bulkRecipients}
                      onChange={(e) => setBulkRecipients(e.target.value)}
                      rows={6}
                    />
                    <Button onClick={processBulkRecipients} variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Process Recipients
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Recipients List */}
              {formData.recipients.length > 0 && (
                <div className="mt-4">
                  <Separator className="mb-4" />
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.recipients.map((email, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(email)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProviders ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active providers found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please configure an email provider first
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Provider</Label>
                    <Select
                      value={formData.userProviderId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, userProviderId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <span>{provider.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {provider.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProvider && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Quota</span>
                        <span>{selectedProvider.usedToday || 0} / {selectedProvider.dailyQuota}</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((selectedProvider.usedToday || 0) / selectedProvider.dailyQuota) * 100)}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedProvider.dailyQuota - (selectedProvider.usedToday || 0)} emails remaining today
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Recipients:</span>
                <span className="font-medium">{formData.recipients.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subject:</span>
                <span className="font-medium truncate ml-2">
                  {formData.subject || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Provider:</span>
                <span className="font-medium truncate ml-2">
                  {selectedProvider?.name || 'Not selected'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                {formData.subject && formData.body && formData.recipients.length > 0 && formData.userProviderId ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Ready to send</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600">Incomplete</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.subject || !formData.body || formData.recipients.length === 0 || !formData.userProviderId}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Submitting...' : 'Send Campaign'}
          </Button>
        </div>
      </div>
    </div>
  );
}
