'use client';
import React from 'react';

import { useState } from 'react';
import { EngagementItem, EmailCampaign } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import {   analyticsApi, emailApi, engagementApi } from '@/lib/api/client';
import Link from 'next/link';
import { 
  Activity, Users, Mail, Inbox as InboxIcon, 
  ArrowRight, Sparkles, Plus, Clock, Filter, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function Dashboard() {
  const { currentOrgId: ORG_ID, user } = useAuth();
  const { toast } = useToast();

  const [dateFilter, setDateFilter] = useState('30');
  const [platformFilter, setPlatformFilter] = useState('ALL');

  const getDates = () => {
    if (dateFilter === 'ALL') return ;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(dateFilter));
    d.setHours(0, 0, 0, 0);
    return { start_date: d.toISOString() };
  };

  const queryParams = { ...getDates(), ...(platformFilter !== 'ALL' ? { platform: platformFilter } : {}) } as Record<string, string>;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics_overview', ORG_ID, queryParams],
    queryFn: () => analyticsApi.getOverview(ORG_ID!, queryParams),
    enabled: !!ORG_ID
  });

  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ['analytics_recommendations', ORG_ID],
    queryFn: () => analyticsApi.getRecommendations(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: engagements = [], isLoading: engLoading } = useQuery({
    queryKey: ['engagements', ORG_ID],
    queryFn: () => engagementApi.getEngagements(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: emails = [], isLoading: emlLoading } = useQuery({
    queryKey: ['emails', ORG_ID],
    queryFn: () => emailApi.getEmails(ORG_ID!),
    enabled: !!ORG_ID
  });

  if (!ORG_ID) {
    return <DashboardSkeleton />;
  }

  const pendingEngagements = engagements.filter((e: { reply_status: string }) => e.reply_status === 'PENDING' || e.reply_status === 'AI_DRAFTED').length;
  const activeEmails = emails.filter((e: { status: string }) => e.status !== 'SENT').length;
  
  const combinedActivity = [
    ...engagements.slice(0, 5).map((e: EngagementItem) => ({
      id: `eng-${e.id}`,
      title: `New ${(e.sentiment || 'NEUTRAL').toLowerCase()} comment from ${e.author_name}`,
      time: new Date(e.created_at || new Date()),
      type: 'engagement',
      icon: InboxIcon,
      link: '/inbox'
    })),
    ...emails.slice(0, 5).map((e: EmailCampaign) => ({
      id: `eml-${e.id}`,
      title: `Email Campaign: ${e.name} (${e.status})`,
      time: new Date(e.created_at || new Date()),
      type: 'email',
      icon: Mail,
      link: `/email/${e.id}`
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="page-description">Here&apos;s what&apos;s happening across your workspace today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-border shadow-sm hidden sm:flex">
            <div className="flex items-center pl-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
            </div>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-muted border-0 rounded-lg text-sm font-medium text-slate-700 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="ALL">All time</option>
            </select>
            
            <select 
              value={platformFilter} 
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-muted border-0 rounded-lg text-sm font-medium text-slate-700 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Platforms</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="X">X (Twitter)</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
          
          <button 
            onClick={async () => {
              try {
                const { downloadAPI } = await import('@/lib/api/client');
                await downloadAPI(`/organizations/${ORG_ID}/analytics/export`, 'dashboard_analytics_export.csv');
              } catch (error: unknown) {
                toast({ title: 'Export failed', description: ((error as Error).message || "Error") || 'Could not export data.', type: 'error' });
              }
            }}
            className="inline-flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          
          <Link 
            href="/campaigns" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          label="Total Reach" 
          value={overviewLoading ? null : (overview?.reach?.toLocaleString() || 0)} 
          icon={Users}
        />
        <MetricCard 
          label="Avg Engagement" 
          value={overviewLoading ? null : `${(overview?.engagement_rate * 100 || 0).toFixed(1)}%`} 
          icon={Activity}
        />
        <MetricCard 
          label="Needs Reply" 
          value={engLoading ? null : pendingEngagements} 
          icon={InboxIcon}
          alert={pendingEngagements > 0} 
        />
        <MetricCard 
          label="Active Emails" 
          value={emlLoading ? null : activeEmails} 
          icon={Mail}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Insights & Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-border/60 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                AI Strategic Recommendations
              </h2>
              
              {recLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse bg-muted p-4 rounded-lg border border-border space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                    </div>
                  ))}
                </div>
              ) : recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec: { insight?: string; title?: string; recommendation?: string; priority?: string; reason?: string; category?: string; }, idx: number) => (
                    <div key={idx} className="group bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 p-5 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{rec.insight || rec.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{rec.recommendation}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 tracking-wide uppercase">
                          {rec.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm py-8 text-center bg-muted rounded-lg border border-dashed border-border">
                  No insights available right now. Generate more content to feed the AI!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-border/60 p-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-[2px] before:bg-muted">
              {(engLoading || emlLoading) ? (
                [1,2,3].map(i => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse relative z-10 ring-4 ring-white" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
                      <div className="h-2 bg-slate-200 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : combinedActivity.length > 0 ? (
                combinedActivity.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center relative z-10 group-hover:border-indigo-500 transition-colors">
                      <item.icon className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={item.link} className="font-medium text-foreground text-sm hover:text-indigo-600 transition-colors">
                          {item.title}
                        </Link>
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {item.time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm text-center relative z-10 bg-white py-2">
                  No recent activity.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm border border-slate-800 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl" />
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3 relative z-10">
              <Link href="/campaigns" className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/5">
                Start AI Campaign
                <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
              <Link href="/email" className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/5">
                Draft Email
                <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
              <Link href="/inbox" className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/5">
                Check Inbox
                <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, alert = false }: { label: string, value: string | number | null, icon: React.ElementType, alert?: boolean }) {
  return (
    <div className={cn(
      "app-card p-6 transition-all duration-300 hover:shadow-md",
      alert ? "border-amber-200 bg-amber-50/30" : "border-border/60"
    )}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <div className={cn(
          "p-2 rounded-lg",
          alert ? "bg-amber-100 text-amber-600" : "bg-muted text-slate-600"
        )}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        {value === null ? (
          <div className="h-8 bg-slate-200 rounded w-16 animate-pulse" />
        ) : (
          <div className={cn("text-3xl font-bold tracking-tight", alert ? "text-amber-700" : "text-foreground")}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-border h-32" />
        ))}
      </div>
      <div className="h-96 bg-white rounded-xl border border-border" />
    </div>
  );
}


