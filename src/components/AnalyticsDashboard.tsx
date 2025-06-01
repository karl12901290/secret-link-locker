
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Eye, Link, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsService } from "@/services/analyticsService";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: () => user ? AnalyticsService.getDashboardAnalytics(user.id) : null,
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading analytics..." />;
  }

  if (error || !analytics?.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to load analytics data
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = analytics.analytics!;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLinks}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeLinks} active, {data.expiredLinks} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Across all your links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeLinks}</div>
            <p className="text-xs text-muted-foreground">
              Currently accessible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Links</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.expiredLinks}</div>
            <p className="text-xs text-muted-foreground">
              No longer accessible
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Links created and views over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="linksCreated" 
                  stroke="#8884d8" 
                  name="Links Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalViews" 
                  stroke="#82ca9d" 
                  name="Total Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
            <CardDescription>Your most viewed links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformingLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium truncate max-w-48">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.views} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${Math.min(100, (link.views / Math.max(...data.topPerformingLinks.map(l => l.views))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {data.topPerformingLinks.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No link data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
