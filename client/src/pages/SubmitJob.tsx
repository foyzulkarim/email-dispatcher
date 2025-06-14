
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ChevronDown } from "lucide-react";

export default function SubmitJob() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [bulkRecipients, setBulkRecipients] = useState("");
  const [metadata, setMetadata] = useState<Array<{key: string, value: string}>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: apiService.submitEmailJob,
    onSuccess: (data) => {
      toast({
        title: "Job Submitted Successfully",
        description: `Job ID: ${data.jobId}. Your email job has been queued for processing.`,
      });
      // Reset form
      setSubject("");
      setBody("");
      setRecipients([""]);
      setBulkRecipients("");
      setMetadata([]);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addRecipient = () => {
    setRecipients([...recipients, ""]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const addMetadata = () => {
    setMetadata([...metadata, { key: "", value: "" }]);
  };

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const updateMetadata = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  const parseBulkRecipients = (text: string): string[] => {
    return text
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  const getAllRecipients = (): string[] => {
    const individual = recipients.filter(email => email.trim().length > 0);
    const bulk = parseBulkRecipients(bulkRecipients);
    const all = [...individual, ...bulk];
    return [...new Set(all)]; // Remove duplicates
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isFormValid = (): boolean => {
    if (!subject.trim() || !body.trim()) return false;
    const allRecipients = getAllRecipients();
    if (allRecipients.length === 0) return false;
    return allRecipients.every(validateEmail);
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    const allRecipients = getAllRecipients();
    const metadataObj = metadata.reduce((acc, item) => {
      if (item.key.trim() && item.value.trim()) {
        acc[item.key.trim()] = item.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    submitMutation.mutate({
      subject: subject.trim(),
      body: body.trim(),
      recipients: allRecipients,
      metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
    });
  };

  const allRecipients = getAllRecipients();
  const validRecipients = allRecipients.filter(validateEmail);
  const invalidRecipients = allRecipients.filter(email => !validateEmail(email));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit New Email Job</h1>
        <p className="text-muted-foreground">Create and send emails to multiple recipients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recommended maximum: 78 characters</span>
              <span>{subject.length}/200</span>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message Body *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your email message"
              rows={8}
              maxLength={10000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Plain text or HTML content supported</span>
              <span>{body.length}/10,000</span>
            </div>
          </div>

          <Separator />

          {/* Recipients */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recipients</h3>
            
            {/* Individual Recipients */}
            <div className="space-y-2">
              <Label>Individual Recipients</Label>
              {recipients.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={email}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="email@example.com"
                    className={email && !validateEmail(email) ? "border-red-500" : ""}
                  />
                  {recipients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipient}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>

            {/* Bulk Recipients */}
            <div className="space-y-2">
              <Label htmlFor="bulk">Bulk Recipients</Label>
              <Textarea
                id="bulk"
                value={bulkRecipients}
                onChange={(e) => setBulkRecipients(e.target.value)}
                placeholder="Paste multiple emails separated by commas, semicolons, or new lines"
                rows={4}
              />
              {bulkRecipients && (
                <div className="text-sm text-muted-foreground">
                  Found {parseBulkRecipients(bulkRecipients).length} emails
                </div>
              )}
            </div>

            {/* Recipients Summary */}
            {allRecipients.length > 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default">{validRecipients.length} Valid</Badge>
                  {invalidRecipients.length > 0 && (
                    <Badge variant="destructive">{invalidRecipients.length} Invalid</Badge>
                  )}
                  <Badge variant="outline">{allRecipients.length} Total</Badge>
                </div>
                {invalidRecipients.length > 0 && (
                  <div className="text-sm text-red-600">
                    Invalid emails: {invalidRecipients.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto font-medium">
                <ChevronDown className="h-4 w-4 mr-2" />
                Metadata (Optional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <p className="text-sm text-muted-foreground">
                Add custom key-value pairs for campaign tracking and analytics.
              </p>
              {metadata.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item.key}
                    onChange={(e) => updateMetadata(index, 'key', e.target.value)}
                    placeholder="Key"
                  />
                  <Input
                    value={item.value}
                    onChange={(e) => updateMetadata(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeMetadata(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMetadata}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Metadata
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Preview */}
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto font-medium">
                <ChevronDown className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <div><strong>Subject:</strong> {subject || "(No subject)"}</div>
                  <div><strong>Recipients:</strong> {validRecipients.length} valid recipients</div>
                  <Separator />
                  <div>
                    <strong>Message:</strong>
                    <div className="mt-2 whitespace-pre-wrap">{body || "(No message)"}</div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || submitMutation.isPending}
              className="flex-1"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Job"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubject("");
                setBody("");
                setRecipients([""]);
                setBulkRecipients("");
                setMetadata([]);
              }}
            >
              Clear Form
            </Button>
          </div>

          {validRecipients.length > 100 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You're sending to {validRecipients.length} recipients. Large batches may take longer to process.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
