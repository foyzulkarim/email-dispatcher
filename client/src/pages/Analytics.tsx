
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data
const mockVolumeData = [
  { date: "2024-01-01", sent: 1250, failed: 23, total: 1273 },
  { date: "2024-01-02", sent: 1340, failed: 18, total: 1358 },
  { date: "2024-01-03", sent: 1180, failed: 32, total: 1212 },
  { date: "2024-01-04", sent: 1420, failed: 15, total: 1435 },
  { date: "2024-01-05", sent: 1380, failed: 28, total: 1408 },
  { date: "2024-01-06", sent: 1560, failed: 12, total: 1572 },
  { date: "2024-01-07", sent: 1450, failed: 35, total: 1485 },
];

const mockProviderData = [
  { date: "2024-01-01", sent: 1250 },
  { date: "2024-01-02", sent: 1340 },
  { date: "2024-01-03", sent: 1180 },
  { date: "2024-01-04", sent: 1420 },
  { date: "2024-01-05", sent: 1380 },
  { date: "2024-01-06", sent: 1560 },
  { date: "2024-01-07", sent: 1450 },
];

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateSuccessRate = (sent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  const successRateData = mockVolumeData.map(item => ({
    date: item.date,
    successRate: calculateSuccessRate(item.sent, item.total),
  }));

  const totalSent = mockVolumeData.reduce((sum, item) => sum + item.sent, 0);
  const totalFailed = mockVolumeData.reduce((sum, item) => sum + item.failed, 0);
  const totalEmails = totalSent + totalFailed;
  const overallSuccessRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your email performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
              <p className="text-3xl font-bold text-green-600">{totalSent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">emails delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Failed</p>
              <p className="text-3xl font-bold text-red-600">{totalFailed.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">delivery failures</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-blue-600">{overallSuccessRate}%</p>
              <p className="text-sm text-muted-foreground">delivery success</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
              <p className="text-3xl font-bold">{totalEmails.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">emails processed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Email Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [value.toLocaleString(), name === 'sent' ? 'Sent' : 'Failed']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="sent"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [`${value}%`, 'Success Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockProviderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                />
                <Bar dataKey="sent" fill="#22c55e" name="Emails Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="text-lg font-bold">
                  {formatDate(mockVolumeData.reduce((a, b) => a.total > b.total ? a : b).date)}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Best Success Rate</p>
                <p className="text-lg font-bold">
                  {Math.max(...successRateData.map(d => d.successRate))}%
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Key Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average daily volume</span>
                  <span className="font-medium">
                    {Math.round(totalEmails / mockVolumeData.length).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total jobs processed</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suppressed emails</span>
                  <span className="font-medium">342</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
