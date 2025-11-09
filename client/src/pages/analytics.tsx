import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<{
    conversionRate: number;
    avgDealSize: number;
    avgTimeToClose: number;
    leadTrend: { month: string; leads: number; won: number }[];
    performanceByUser: { user: string; leads: number; won: number; value: number }[];
    statusDistribution: { status: string; count: number; percentage: number }[];
  }>({
    queryKey: ["/api/analytics"],
  });

  const statusColors = {
    new: "#3b82f6",
    contacted: "#eab308",
    qualified: "#8b5cf6",
    proposal: "#f59e0b",
    negotiation: "#06b6d4",
    won: "#22c55e",
    lost: "#ef4444",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-analytics-title">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep insights into your sales performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-conversion-rate">
              {analytics?.conversionRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Leads converted to wins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-avg-deal-size">
              ₹{(analytics?.avgDealSize || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average value of won deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Close</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-avg-time-to-close">
              {Math.round(analytics?.avgTimeToClose || 0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From lead creation to won
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Trend (Last 6 Months)</CardTitle>
          <CardDescription>Total leads vs. won leads over time</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.leadTrend && analytics.leadTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics.leadTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Total Leads"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line
                  type="monotone"
                  dataKey="won"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Won Leads"
                  dot={{ fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Leads and wins by team member</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.performanceByUser && analytics.performanceByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.performanceByUser}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="user" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" name="Total Leads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="won" fill="#22c55e" name="Won Leads" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.statusDistribution && analytics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status} (${percentage.toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={statusColors[entry.status.toLowerCase() as keyof typeof statusColors] || "#888"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
