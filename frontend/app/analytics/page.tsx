'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';


export default function AnalyticsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('30');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [syncMessage, setSyncMessage] = useState('');

  // Compute dates for filtering
  const getDates = () => {
    if (dateFilter === 'ALL') return {};
    const d = new Date();
    d.setDate(d.getDate() - parseInt(dateFilter));
    d.setHours(0, 0, 0, 0); // Stable timestamp to prevent React Query infinite loops
    return { start_date: d.toISOString() };
  };

  const queryParams = { ...getDates(), ...(platformFilter !== 'ALL' ? { platform: platformFilter } : {}) };

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics-overview', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getOverview(ORG_ID, queryParams),
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['analytics-trends', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getTrends(ORG_ID, queryParams),
  });

  const { data: platforms, isLoading: isPlatformsLoading } = useQuery({
    queryKey: ['analytics-platforms', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getPlatforms(ORG_ID, queryParams),
  });

  const { data: topContent, isLoading: isTopContentLoading } = useQuery({
    queryKey: ['analytics-top', ORG_ID],
    queryFn: () => analyticsApi.getTopContent(ORG_ID),
  });

  const { data: recommendations, isLoading: isRecLoading } = useQuery({
    queryKey: ['analytics-recommendations', ORG_ID],
    queryFn: () => analyticsApi.getRecommendations(ORG_ID),
  });

  const syncMutation = useMutation({
    mutationFn: () => analyticsApi.syncAnalytics(ORG_ID),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-platforms'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-top'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-recommendations'] });
      setSyncMessage(`Synced ${res.synced_posts} posts.`);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  });

  const isLoading = isOverviewLoading || isTrendsLoading || isPlatformsLoading || isTopContentLoading || isRecLoading;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading analytics dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Monitor your social media performance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="border-slate-300 rounded-md text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="ALL">All time</option>
          </select>
          
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border-slate-300 rounded-md text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="X">X (Twitter)</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>

          <div className="flex items-center gap-2">
            {syncMessage && <span className="text-sm text-green-600 font-medium">{syncMessage}</span>}
            <button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {overview?.posts_published === 0 ? (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No analytics data yet</h3>
          <p className="text-slate-500 mb-6">Publish your first post and sync analytics to start tracking marketing performance.</p>
          <button onClick={() => syncMutation.mutate()} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700">
            Sync Analytics
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Impressions" value={overview?.impressions.toLocaleString()} />
            <KpiCard title="Reach" value={overview?.reach.toLocaleString()} />
            <KpiCard title="Engagements" value={overview?.engagements.toLocaleString()} />
            <KpiCard title="Clicks" value={overview?.clicks.toLocaleString()} />
            <KpiCard title="Avg. Eng. Rate" value={`${overview?.engagement_rate}%`} />
            <KpiCard title="Posts Synced" value={overview?.posts_published} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Engagement Trend</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94A3B8" />
                    <YAxis tick={{fontSize: 12}} stroke="#94A3B8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="engagements" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Platform Performance</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platforms} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{fontSize: 12}} stroke="#94A3B8" />
                    <YAxis dataKey="platform" type="category" tick={{fontSize: 12}} stroke="#94A3B8" width={80} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="engagements" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-0 rounded-lg shadow border border-slate-200 lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Top Performing Content</h2>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Content</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Engagements</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {topContent?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.platform}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div className="font-semibold text-slate-700 mb-1 line-clamp-1">{item.title}</div>
                          <div className="line-clamp-1">{item.content_preview}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-indigo-600">{item.engagements.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{item.engagement_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-xl">✨</span>
                <h2 className="text-lg font-semibold text-slate-800">AI Recommendations</h2>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {(!recommendations || recommendations.length === 0) ? (
                  <p className="text-slate-500 text-sm italic">Not enough data to generate insights yet.</p>
                ) : (
                  recommendations.map((rec: any, i: number) => (
                    <div key={i} className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-indigo-900 text-sm">{rec.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 font-medium">{rec.recommendation}</p>
                      <p className="text-xs text-slate-500 border-t border-indigo-100 pt-2"><span className="font-semibold">Why:</span> {rec.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
