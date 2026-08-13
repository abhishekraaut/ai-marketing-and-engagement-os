'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ChartNoAxesColumn, RefreshCcw, Activity, Users, MousePointerClick, TrendingUp, Filter, Sparkles, Download, X } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api/client';

export default function AnalyticsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [dateFilter, setDateFilter] = useState('30');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const getDates = () => {
    if (dateFilter === 'ALL') return {};
    const d = new Date();
    d.setDate(d.getDate() - parseInt(dateFilter));
    d.setHours(0, 0, 0, 0);
    return { start_date: d.toISOString() };
  };

  const queryParams = { ...getDates(), ...(platformFilter !== 'ALL' ? { platform: platformFilter } : {}) };

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics-overview', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getOverview(ORG_ID!, queryParams),
    enabled: !!ORG_ID
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['analytics-trends', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getTrends(ORG_ID!, queryParams),
    enabled: !!ORG_ID
  });

  const { data: platforms, isLoading: isPlatformsLoading } = useQuery({
    queryKey: ['analytics-platforms', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getPlatforms(ORG_ID!, queryParams),
    enabled: !!ORG_ID
  });

  const { data: topContent, isLoading: isTopContentLoading } = useQuery({
    queryKey: ['analytics-top', ORG_ID],
    queryFn: () => analyticsApi.getTopContent(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: recommendations, isLoading: isRecLoading } = useQuery({
    queryKey: ['analytics-recommendations', ORG_ID],
    queryFn: () => analyticsApi.getRecommendations(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: postDetail, isLoading: isPostDetailLoading } = useQuery({
    queryKey: ['analytics-post-detail', ORG_ID, selectedPostId],
    queryFn: () => analyticsApi.getPostAnalytics(ORG_ID!, selectedPostId!),
    enabled: !!ORG_ID && !!selectedPostId
  });

  const handleExport = async () => {
    try {
      const { downloadAPI } = await import('@/lib/api/client');
      await downloadAPI(`/organizations/${ORG_ID}/analytics/export`, 'analytics_export.csv');
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message || 'Could not export data.', type: 'error' });
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => analyticsApi.syncAnalytics(ORG_ID!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-platforms'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-top'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-recommendations'] });
      toast({ title: 'Sync Complete', description: `Successfully synced ${res.synced_posts} posts.`, type: 'success' });
    },
    onError: () => {
      toast({ title: 'Sync Failed', description: 'Could not sync analytics data. Please try again.', type: 'error' });
    }
  });

  if (!ORG_ID) return <AnalyticsSkeleton />;

  const isLoading = isOverviewLoading || isTrendsLoading || isPlatformsLoading || isTopContentLoading || isRecLoading;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ChartNoAxesColumn className="w-6 h-6 text-indigo-600" />
            Analytics Intelligence
          </h1>
          <p className="text-slate-500 mt-1">Deep dive into your cross-channel marketing performance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="flex items-center pl-2 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-50 border-0 rounded-lg text-sm font-medium text-slate-700 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="ALL">All time</option>
          </select>
          
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-50 border-0 rounded-lg text-sm font-medium text-slate-700 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Platforms</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="X">X (Twitter)</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm ml-auto xl:ml-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {overview?.posts_published === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ChartNoAxesColumn className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No data available</h3>
          <p className="text-slate-500 mb-8 max-w-md">You haven't published any posts yet. Publish content and sync analytics to start building your dashboard.</p>
          <button 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <RefreshCcw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
            Sync Now
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard title="Impressions" value={overview?.impressions.toLocaleString()} icon={Users} />
            <KpiCard title="Reach" value={overview?.reach.toLocaleString()} icon={Activity} />
            <KpiCard title="Engagements" value={overview?.engagements.toLocaleString()} icon={TrendingUp} />
            <KpiCard title="Clicks" value={overview?.clicks.toLocaleString()} icon={MousePointerClick} />
            <KpiCard title="Avg. Eng. Rate" value={`${overview?.engagement_rate}%`} icon={Activity} />
            <KpiCard title="Posts Synced" value={overview?.posts_published} icon={ChartNoAxesColumn} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Engagement Trends</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="engagements" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Platform Distribution</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platforms} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis dataKey="platform" type="category" tick={{fontSize: 12, fill: '#475569', fontWeight: 500}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="engagements" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Top Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 xl:col-span-2 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Top Performing Content</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagements</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topContent?.map((item: any, i: number) => (
                      <tr key={i} onClick={() => setSelectedPostId(item.published_post_id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">{item.platform}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-semibold text-slate-900 mb-1 line-clamp-1">{item.title}</div>
                          <div className="text-slate-500 line-clamp-1">{item.content_preview}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                            {item.engagements.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-600">
                          {item.engagement_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-b from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col h-[500px]">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">AI Analysis</h2>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {(!recommendations || recommendations.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-slate-500 text-sm">Not enough data to generate insights.</p>
                  </div>
                ) : (
                  recommendations.map((rec: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        rec.priority === 'HIGH' ? "bg-amber-400" : "bg-indigo-400"
                      )} />
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{rec.title}</h3>
                        <span className={cn(
                          "text-[10px] font-extrabold px-2 py-1 rounded tracking-widest",
                          rec.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        )}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{rec.recommendation}</p>
                      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                        <strong className="text-slate-700">Insight:</strong> {rec.reason}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {selectedPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Post Performance</h2>
              <button onClick={() => setSelectedPostId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isPostDetailLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-slate-100 rounded-xl"></div>
                  <div className="h-24 bg-slate-100 rounded-xl"></div>
                </div>
              ) : postDetail ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase">Platform</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{postDetail.platform}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase">Impressions</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{postDetail.impressions.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase">Reach</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{postDetail.reach.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase">Eng. Rate</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{postDetail.conversion_rate}%</div>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-900">Engagement Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Likes</span>
                      <span className="font-bold text-slate-900">{postDetail.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Comments</span>
                      <span className="font-bold text-slate-900">{postDetail.comments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Shares</span>
                      <span className="font-bold text-slate-900">{postDetail.shares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">URL Clicks</span>
                      <span className="font-bold text-slate-900">{postDetail.url_clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Followers Gained</span>
                      <span className="font-bold text-emerald-600">+{postDetail.followers?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 p-8">No detailed data found for this post.</div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, positive }: { title: string, value: string | number | undefined, icon: any, trend?: string, positive?: boolean }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{value ?? '-'}</div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded",
            positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-10 bg-slate-200 rounded w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-slate-200" />
        <div className="h-96 bg-white rounded-xl border border-slate-200" />
      </div>
    </div>
  );
}
