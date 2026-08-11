'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { 
  analyticsApi, 
  campaignsApi, 
  emailApi, 
  engagementApi 
} from '@/lib/api/client';
import Link from 'next/link';


export default function Dashboard() {
  const { currentOrgId: ORG_ID } = useAuth();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics_overview', ORG_ID],
    queryFn: () => analyticsApi.getOverview(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ['analytics_recommendations', ORG_ID],
    queryFn: () => analyticsApi.getRecommendations(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements', ORG_ID],
    queryFn: () => engagementApi.getEngagements(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['emails', ORG_ID],
    queryFn: () => emailApi.getEmails(ORG_ID!),
    enabled: !!ORG_ID
  });

  if (!ORG_ID || overviewLoading) {
    return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;
  }

  const pendingEngagements = engagements.filter((e: any) => e.reply_status === 'PENDING' || e.reply_status === 'AI_DRAFTED').length;
  const activeEmails = emails.filter((e: any) => e.status !== 'SENT').length;
  
  // Create a combined activity feed
  const combinedActivity = [
    ...engagements.slice(0, 5).map((e: any) => ({
      id: `eng-${e.id}`,
      title: `New ${e.sentiment} comment from ${e.author_name}`,
      time: new Date(e.created_at),
      type: 'engagement',
      link: '/inbox'
    })),
    ...emails.slice(0, 5).map((e: any) => ({
      id: `eml-${e.id}`,
      title: `Email Campaign: ${e.name} (${e.status})`,
      time: new Date(e.created_at), // Should be updated_at realistically
      type: 'email',
      link: `/email/${e.id}`
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing OS Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Cross-channel performance and active workflows.</p>
        </div>
        <Link href="/campaigns" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
          + New Campaign
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Reach" value={overview?.total_reach?.toLocaleString() || 0} />
        <MetricCard label="Engagement Rate" value={`${(overview?.avg_engagement_rate * 100 || 0).toFixed(1)}%`} />
        <MetricCard label="Pending Inbox Replies" value={pendingEngagements} alert={pendingEngagements > 0} />
        <MetricCard label="Active Emails" value={activeEmails} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="col-span-2 space-y-6">
          
          {/* AI Insights & Recommendations */}
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>✨</span> AI Analytics Recommendations
            </h2>
            {recLoading ? (
              <div className="text-slate-500 text-sm">Analyzing performance data...</div>
            ) : recommendations?.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec: any) => (
                  <div key={rec.title} className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 text-sm mb-1">{rec.insight || rec.title}</h3>
                    <p className="text-indigo-700 text-sm">{rec.recommendation}</p>
                    <div className="mt-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">{rec.category}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No insights available right now.</div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {combinedActivity.length > 0 ? combinedActivity.map((item) => (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                      <time className="text-[10px] text-slate-500">{item.time.toLocaleDateString()}</time>
                    </div>
                    <Link href={item.link} className="text-[10px] text-indigo-600 font-medium hover:underline">View Details →</Link>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm text-center">No recent activity.</div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-2">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link href="/campaigns" className="text-sm text-indigo-600 font-medium hover:underline bg-white p-2 rounded border border-slate-200 text-center">Start AI Campaign</Link>
              <Link href="/email" className="text-sm text-indigo-600 font-medium hover:underline bg-white p-2 rounded border border-slate-200 text-center">Draft Email</Link>
              <Link href="/inbox" className="text-sm text-indigo-600 font-medium hover:underline bg-white p-2 rounded border border-slate-200 text-center">Check Inbox</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, alert = false }: { label: string, value: string | number, change?: string, alert?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border ${alert ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${alert ? 'text-red-600' : 'text-slate-500'}`}>{label}</h3>
        {change && (
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">{change}</span>
        )}
      </div>
      <div className={`text-3xl font-bold ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}
