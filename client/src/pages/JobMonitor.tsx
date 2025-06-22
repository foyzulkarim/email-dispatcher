
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw, Eye, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { EmailJob } from "@/types/api";

export default function JobMonitor() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getEmailJobs(1, 50, statusFilter === "all" ? undefined : statusFilter);
      
      // Normalize job data for UI
      const normalizedJobs = (response.jobs || []).map(job => ({
        ...job,
        recipientCount: job.recipients?.length || 0,
        processedCount: job.recipientCount || job.recipients?.length || 0,
        successCount: job.status === 'completed' ? (job.recipients?.length || 0) : 0,
        failedCount: job.status === 'failed' ? (job.recipients?.length || 0) : 0,
        completedAt: job.status === 'completed' ? job.updatedAt : undefined,
      }));
      
      setJobs(normalizedJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load email jobs",
        variant: "destructive",
      });
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = jobs.filter(job =>
    job.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressPercentage = (job: EmailJob) => {
    if (job.recipientCount === 0) return 0;
    return Math.round((job.processedCount / job.recipientCount) * 100);
  };

  const getSuccessRate = (job: EmailJob) => {
    if (job.processedCount === 0) return 0;
    return Math.round((job.successCount / job.processedCount) * 100);
  };

  // Calculate summary stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;
  const totalEmails = jobs.reduce((sum, j) => sum + j.recipientCount, 0);
  const successfulEmails = jobs.reduce((sum, j) => sum + j.successCount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Job Monitor</h1>
            <p className="text-muted-foreground">Track your email campaigns and deliveries</p>
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
          <h1 className="text-3xl font-bold">Email Job Monitor</h1>
          <p className="text-muted-foreground">Track your email campaigns and deliveries</p>
        </div>
        <Button onClick={loadJobs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{totalJobs}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{processingJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedJobs}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search jobs by subject or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-sm">
                    {job.id.substring(0, 12)}...
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {job.subject}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <StatusBadge status={job.status as any} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{job.recipientCount} total</div>
                      <div className="text-muted-foreground">
                        {job.successCount} sent, {job.failedCount} failed
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full">
                      <Progress value={getProgressPercentage(job)} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {getProgressPercentage(job)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      getSuccessRate(job) >= 95 ? 'text-green-600' :
                      getSuccessRate(job) >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getSuccessRate(job)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(job.createdAt).toLocaleDateString()}
                      <div className="text-muted-foreground">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Job Details</DialogTitle>
                        </DialogHeader>
                        {selectedJob && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Job ID</h4>
                                <p className="text-sm font-mono">{selectedJob.id}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(selectedJob.status)}
                                  <StatusBadge status={selectedJob.status as any} />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">Subject</h4>
                              <p className="text-sm">{selectedJob.subject}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">Recipients</h4>
                              <div className="text-sm space-y-1">
                                <p>Total: {selectedJob.recipientCount}</p>
                                <p>Processed: {selectedJob.processedCount}</p>
                                <p>Successful: {selectedJob.successCount}</p>
                                <p>Failed: {selectedJob.failedCount}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">Timeline</h4>
                              <div className="text-sm space-y-1">
                                <p>Created: {new Date(selectedJob.createdAt).toLocaleString()}</p>
                                {selectedJob.completedAt && (
                                  <p>Completed: {new Date(selectedJob.completedAt).toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                            
                            {selectedJob.metadata && Object.keys(selectedJob.metadata).length > 0 && (
                              <div>
                                <h4 className="font-medium">Metadata</h4>
                                <pre className="text-xs bg-muted p-2 rounded">
                                  {JSON.stringify(selectedJob.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredJobs.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Jobs Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No jobs match your search criteria." : "You haven't sent any emails yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
