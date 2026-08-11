"use client";

import { useState, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Globe,
  Smartphone,
  MousePointer2,
  TrendingUp,
  ArrowUpRight,
  Link2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { appFetch } from "@/lib/api";

interface DeviceStats {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
    mobilePercentage: number;
    desktopPercentage: number;
    tabletPercentage: number;
}

interface TopCountry {
    country: string;
    clicks: number;
    percentage: number;
}

interface AnalyticsItem {
    code: string;
    originalUrl: string;
    totalClicks: number;
    createdAt: string;
    clicksByDate: Record<string, number>;
    clicksByHour: Record<string, number>;
    topCountries: TopCountry[];
    topCities: any[];
    deviceStats: DeviceStats;
    topBrowsers: any[];
    topReferrers: any[];
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await appFetch(
          `/api/analytics`,
          {
            headers: {
                "Authorization": token ? `Bearer ${token}` : ""
            }
          }
        );
        if (response.ok) {
          const result = await response.json();
          setData(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Aggregations
  const stats = useMemo(() => {
    const totalClicks = data.reduce((acc, curr) => acc + curr.totalClicks, 0);
    const totalLinks = data.length;
    const avgClicks = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0;

    // Device Distribution Aggregation
    let mobile = 0, desktop = 0, tablet = 0, unknown = 0;
    data.forEach(item => {
        mobile += item.deviceStats.mobile;
        desktop += item.deviceStats.desktop;
        tablet += item.deviceStats.tablet;
        unknown += item.deviceStats.unknown;
    });

    const deviceData = [
        { name: "Desktop", value: desktop },
        { name: "Mobile", value: mobile },
        { name: "Tablet", value: tablet },
        { name: "Other", value: unknown }
    ].filter(d => d.value > 0);

    // Browser Distribution
    const browserCounts: Record<string, number> = {};
    data.forEach(item => {
        item.topBrowsers.forEach(b => {
             browserCounts[b.browser] = (browserCounts[b.browser] || 0) + b.clicks;
        });
    });
    const browserData = Object.entries(browserCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 browsers

    // Daily Clicks (Trend)
    const dateCounts: Record<string, number> = {};
    data.forEach(item => {
        Object.entries(item.clicksByDate).forEach(([date, count]) => {
            dateCounts[date] = (dateCounts[date] || 0) + count;
        });
    });
    
    // Sort logic for dates
    const clicksTrend = Object.entries(dateCounts)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Hourly Activity
    const hourCounts: Record<string, number> = {};
    const hours = Array.from({ length: 24 }, (_, i) => i.toString()); // 0-23
    hours.forEach(h => hourCounts[h] = 0); // Init
    
    data.forEach(item => {
        Object.entries(item.clicksByHour).forEach(([hour, count]) => {
            hourCounts[hour] = (hourCounts[hour] || 0) + count;
        });
    });
    
    const hourlyActivity = Object.entries(hourCounts)
        .map(([hour, clicks]) => ({ 
            hour: `${hour}:00`, 
            clicks 
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Top Links for Bar Chart
    const topLinks = [...data]
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 5)
      .map((link) => ({
        name: link.code,
        clicks: link.totalClicks,
        url: link.originalUrl,
      }));
      
    // Find absolute top country and list
    const countryCounts: Record<string, number> = {};
    data.forEach((item) => {
        item.topCountries.forEach((c) => {
            countryCounts[c.country] = (countryCounts[c.country] || 0) + c.clicks;
        });
    });
    const topCountries = Object.entries(countryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
        
    const topGlobalCountry = topCountries.length > 0 ? topCountries[0].name : "N/A";

    return { 
        totalClicks, totalLinks, avgClicks, topGlobalCountry,
        deviceData, browserData, clicksTrend, hourlyActivity, topLinks, topCountries
    };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-sm text-primary">
            {payload[0].value} Clicks
          </p>
          {payload[0].payload.url && (
            <p className="text-xs text-muted-foreground max-w-[200px] truncate mt-1">
              {payload[0].payload.url}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full bg-background flex flex-col font-sans">
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-20 md:pb-24">
         {/* Background Gradients */}
         <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 -left-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto space-y-8 animate-appear">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight inline-flex items-center gap-3">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Insights into your link performance and audience engagement.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="glass-card p-6 rounded-2xl border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MousePointer2 className="w-16 h-16 text-primary" />
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Total Clicks</span>
                <span className="text-3xl md:text-4xl font-bold">{stats.totalClicks.toLocaleString()}</span>
                <div className="flex items-center text-xs text-green-500 font-medium mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  All time
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 rounded-2xl border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Link2 className="w-16 h-16 text-blue-500" />
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Active Links</span>
                <span className="text-3xl md:text-4xl font-bold">{stats.totalLinks.toLocaleString()}</span>
                <div className="flex items-center text-xs text-blue-500 font-medium mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  Total created
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 rounded-2xl border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-16 h-16 text-purple-500" />
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Avg. Clicks / Link</span>
                <span className="text-3xl md:text-4xl font-bold">{stats.avgClicks}</span>
                <div className="flex items-center text-xs text-purple-500 font-medium mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Performance
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 rounded-2xl border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe className="w-16 h-16 text-orange-500" />
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Top Region</span>
                <span className="text-2xl md:text-3xl font-bold truncate">{stats.topGlobalCountry}</span>
                <div className="flex items-center text-xs text-orange-500 font-medium mt-1">
                  <Globe className="w-3 h-3 mr-1" />
                  Based on volume
                </div>
              </div>
            </Card>
          </div>

          {/* Clicks Trend Row */}
          <Card className="glass-card p-6 rounded-2xl border-primary/10">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-primary" />
                   Clicks Over Time
                 </h3>
             </div>
             <div className="h-[300px] w-full">
               {stats.clicksTrend.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.clicksTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                     <XAxis 
                        dataKey="date" 
                        stroke="currentColor" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        className="text-muted-foreground"
                     />
                     <YAxis 
                        stroke="currentColor" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                        className="text-muted-foreground"
                     />
                     <Tooltip content={<CustomTooltip />} />
                     <Area 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="var(--primary)" 
                        fillOpacity={1} 
                        fill="url(#colorClicks)" 
                        strokeWidth={2}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                      No trend data available yet.
                  </div>
               )}
             </div>
          </Card>

          {/* Detailed Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Hourly Activity */}
            <Card className="glass-card p-6 rounded-2xl border-primary/10">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <ArrowUpRight className="w-5 h-5 text-green-500" />
                   Hourly Activity
                 </h3>
               </div>
               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.hourlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} className="text-muted-foreground" interval={3} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                        <Bar dataKey="clicks" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-green-500" />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            {/* Top Countries */}
            <Card className="glass-card p-6 rounded-2xl border-primary/10">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <Globe className="w-5 h-5 text-orange-500" />
                   Top Countries
                 </h3>
               </div>
               <div className="h-[250px] w-full">
                  {stats.topCountries.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.topCountries} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="currentColor" radius={[0, 4, 4, 0]} className="fill-orange-500" barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        No location data available.
                    </div>
                  )}
               </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Device Pie Chart */}
            <Card className="glass-card p-6 rounded-2xl border-primary/10">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <Smartphone className="w-5 h-5 text-blue-500" />
                   Devices Distribution
                 </h3>
               </div>
               <div className="h-[250px] w-full relative">
                 {stats.deviceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                 ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-2">
                       <Smartphone className="w-8 h-8 opacity-20" />
                       <span className="text-sm">No device data</span>
                    </div>
                 )}
               </div>
            </Card>

            {/* Browser Distribution */}
            <Card className="glass-card p-6 rounded-2xl border-primary/10">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <Globe className="w-5 h-5 text-indigo-500" />
                   Browser Distribution
                 </h3>
               </div>
               <div className="h-[250px] w-full relative">
                 {stats.browserData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.browserData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         {stats.browserData.map((entry, index) => (
                          <Cell key={`cell-br-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                 ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-2">
                       <Globe className="w-8 h-8 opacity-20" />
                       <span className="text-sm">No browser data</span>
                    </div>
                 )}
               </div>
            </Card>

            {/* Top Links Bar Chart */}
             <Card className="glass-card p-6 rounded-2xl border-primary/10">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                   <Link2 className="w-5 h-5 text-pink-500" />
                   Top Links
                 </h3>
               </div>
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.topLinks} layout="vertical" margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={60} fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                     <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                     <Bar dataKey="clicks" fill="currentColor" radius={[0, 4, 4, 0]} className="fill-pink-500" barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
