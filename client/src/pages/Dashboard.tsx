
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Mail, Send, Shield, Settings, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

// Fake data
const mockStats = {
  totalJobs: 1247,
  totalEmails: 45623,
  suppressedEmails: 342,
  activeProviders: 3,
  jobStatusBreakdown: {
    pending: 23,
    processing: 5,
    completed: 1198,
    failed: 21,
  },
  emailStatusBreakdown: {
    pending: 156,
    sent: 44890,
    failed: 235,
    blocked: 342,
  },
  todayActivity: {
    sent: 2847,
    failed: 23,
    total: 2870,
    successRate: 99.2,
  },
};

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
];

const mockRecentJobs = [
  {
    id: "job_abc123def456",
    subject: "Weekly Newsletter - Tech Updates",
    status: "completed" as const,
    recipientCount: 1523,
    processedCount: 1523,
    successCount: 1510,
    failedCount: 13,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "job_xyz789ghi012",
    subject: "Product Launch Announcement",
    status: "processing" as const,
    recipientCount: 892,
    processedCount: 654,
    successCount: 642,
    failedCount: 12,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "job_mno345pqr678",
    subject: "Monthly Report - Q1 2024",
    status: "pending" as const,
    recipientCount: 245,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { get } = useApi();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Here you would fetch real data from your API
      // For now, we'll just update the timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isLoading && (
              <span className="ml-2">
                <Loader2 className="h-4 w-4 animate-spin inline" />
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" onClick={() => setLastUpdated(new Date())}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={mockStats.totalJobs}
          subtitle="Email Jobs Created"
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          title="Total Emails"
          value={mockStats.totalEmails}
          subtitle="Individual Emails Sent"
          icon={<Send className="h-4 w-4" />}
        />
        <StatCard
          title="Suppressed Emails"
          value={mockStats.suppressedEmails}
          subtitle="Blocked/Suppressed"
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          title="Active Providers"
          value={mockStats.activeProviders}
          subtitle="Email Providers Online"
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(mockStats.jobStatusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="capitalize">{status}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(mockStats.emailStatusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="capitalize">{status}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-green-600">{mockStats.todayActivity.sent}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{mockStats.todayActivity.failed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{mockStats.todayActivity.total}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <Progress value={mockStats.todayActivity.successRate} className="h-2" />
              <p className="text-sm font-medium">{mockStats.todayActivity.successRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockProviders.map((provider) => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{provider.name}</h3>
                    <StatusBadge status={provider.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quota Usage</span>
                      <span>{provider.quotaUsed}/{provider.quotaTotal}</span>
                    </div>
                    <Progress 
                      value={(provider.quotaUsed / provider.quotaTotal) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Success: {provider.successRate}%</span>
                      <span>Today: {provider.emailsSentToday}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.subject}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.recipientCount} recipients • {new Date(job.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
