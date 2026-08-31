'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trend,  trendsApi } from '@/lib/api/client';
import Link from 'next/link';
import { TrendingUp, Sparkles, AlertTriangle, ArrowRight, Zap, Target, ShieldAlert, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function TrendsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTrend, setSelectedTrend] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Industry', source_url: '' });
  const { toast } = useToast();

  const { data: trends = [], isLoading } = useQuery({
    queryKey: ['trends', ORG_ID],
    queryFn: () => trendsApi.getTrends(ORG_ID!),
    enabled: !!ORG_ID
  });

  const evaluateMutation = useMutation({
    mutationFn: (trendId: number) => trendsApi.evaluateTrend(ORG_ID!, trendId),
    onError: () => {
      toast({ title: 'Evaluation Failed', description: 'Failed to analyze trend against your Brand Brain. Please ensure it is configured.', type: 'error' });
    }
  });

  const fetchLiveMutation = useMutation({
    mutationFn: () => trendsApi.fetchLiveTrends(ORG_ID!),
    onSuccess: (newTrends: Trend[]) => {
      queryClient.invalidateQueries({ queryKey: ['trends', ORG_ID] });
      toast({ title: 'Trends Fetched', description: `Successfully discovered ${newTrends.length} new trends via AI.`, type: 'success' });
    },
    onError: () => {
      toast({ title: 'Fetch Failed', description: 'Failed to fetch live trends via AI.', type: 'error' });
    }
  });

  const createTrendMutation = useMutation({
    mutationFn: (data: Partial<Trend>) => trendsApi.createTrend(ORG_ID!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trends', ORG_ID] });
      toast({ title: 'Trend Added', description: 'Successfully added custom trend.', type: 'success' });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', category: 'Industry', source_url: '' });
    },
    onError: () => {
      toast({ title: 'Add Failed', description: 'Failed to add custom trend.', type: 'error' });
    }
  });

  if (!ORG_ID) return <TrendsSkeleton />;
  if (isLoading) return <TrendsSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Trend Discovery
          </h1>
          <p className="page-description">Discover trending topics and let AI evaluate their relevance to your Brand Brain.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-700 border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Custom Trend
          </button>
          <button 
            onClick={() => fetchLiveMutation.mutate()}
            disabled={fetchLiveMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {fetchLiveMutation.isPending ? 'Fetching...' : 'Fetch Live News (AI)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trend List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Trends</h2>
            <span className="bg-muted text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">{trends.length} active</span>
          </div>
          
          <div className="flex flex-col space-y-3 max-h-[800px] overflow-y-auto pr-2 app-scrollbar">
            {trends.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No active trends found in your industry right now.</p>
              </div>
            ) : (
              trends.map((trend: Trend) => (
                <button
                  key={trend.id}
                  onClick={() => {
                    setSelectedTrend(trend.id);
                    evaluateMutation.mutate(trend.id);
                  }}
                  className={cn(
                    "text-left p-5 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                    selectedTrend === trend.id 
                      ? "border-indigo-500 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500" 
                      : "border-border bg-white hover:border-indigo-300 hover:shadow-sm"
                  )}
                >
                  {selectedTrend === trend.id && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "font-bold pr-2 leading-tight",
                      selectedTrend === trend.id ? "text-indigo-900" : "text-foreground"
                    )}>
                      {trend.title}
                    </span>
                    <span className={cn(
                      "text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shrink-0",
                      selectedTrend === trend.id ? "bg-indigo-200 text-indigo-800" : "bg-muted text-slate-600"
                    )}>
                      {trend.category}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm line-clamp-2",
                    selectedTrend === trend.id ? "text-indigo-700/80" : "text-muted-foreground"
                  )}>
                    {trend.description}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="lg:col-span-2">
          {selectedTrend ? (
            <div className="bg-white rounded-xl shadow-sm border border-border h-full min-h-[500px] flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <div className="p-6 sm:p-8 flex-1">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Brand Relevance Analysis</h2>
                    <p className="text-sm text-muted-foreground">Evaluating against your configured Brand Brain profile.</p>
                  </div>
                </div>
                
                {evaluateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse" />
                      <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute inset-0" />
                      <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="text-indigo-600 font-medium">Synthesizing strategy...</div>
                  </div>
                ) : evaluateMutation.isError ? (
                  <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Analysis Failed</h3>
                      <p className="text-sm">We couldn&apos;t evaluate this trend. Please ensure your Brand Brain is fully configured before running analyses.</p>
                      <Link href="/brand" className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-red-800 hover:underline">
                        Configure Brand Brain <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : evaluateMutation.isSuccess && evaluateMutation.data ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Score Card */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
                      <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-2xl border border-border min-w-[160px]">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                            <circle 
                              cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray={251.2} 
                              strokeDashoffset={251.2 - (251.2 * evaluateMutation.data.relevance_score) / 100}
                              className={cn(
                                "transition-all duration-1000 ease-out",
                                evaluateMutation.data.relevance_score > 70 ? 'text-emerald-500' : 
                                evaluateMutation.data.relevance_score > 40 ? 'text-amber-500' : 'text-muted-foreground'
                              )} 
                            />
                          </svg>
                          <span className="absolute text-3xl font-black text-foreground">
                            {evaluateMutation.data.relevance_score}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Match Score</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          Strategic Verdict
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                          {evaluateMutation.data.reason}
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Angle */}
                      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden group hover:bg-indigo-50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Target className="w-16 h-16 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2 relative z-10">
                          <Target className="w-4 h-4" /> Recommended Angle
                        </h3>
                        <p className="text-indigo-900/80 text-sm leading-relaxed relative z-10 font-medium">
                          {evaluateMutation.data.recommended_angle}
                        </p>
                      </div>

                      {/* Safety */}
                      <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 relative overflow-hidden group hover:bg-amber-50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <ShieldAlert className="w-16 h-16 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-amber-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2 relative z-10">
                          <ShieldAlert className="w-4 h-4" /> Brand Safety
                        </h3>
                        <p className="text-amber-900/80 text-sm leading-relaxed relative z-10 font-medium">
                          {evaluateMutation.data.safety_considerations}
                        </p>
                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
              
              {/* Footer Action */}
              {evaluateMutation.isSuccess && evaluateMutation.data && (
                <div className="p-6 bg-muted border-t border-border mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground font-medium">Ready to capitalize on this trend?</p>
                  <Link 
                    href={`/campaigns?topic=${encodeURIComponent(trends.find((t: { id: number; title: string }) => t.id === selectedTrend)?.title || '')}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300"
                  >
                    Start AI Campaign <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-muted rounded-xl border-2 border-border border-dashed h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center text-muted-foreground group transition-colors hover:bg-muted hover:border-slate-300">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Select a Trend</h3>
              <p className="max-w-md text-muted-foreground">
                Choose a trend from the list to see how well it aligns with your brand profile and get AI-generated content angles tailored to your voice.
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Add Custom Trend</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. The rise of AI in Marketing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Industry">Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Security">Security</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Detailed description of the trend..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source URL (Optional)</label>
                <input 
                  type="text" 
                  value={formData.source_url} 
                  onChange={e => setFormData({...formData, source_url: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://news.com/article"
                />
              </div>
            </div>
            <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-foreground">
                Cancel
              </button>
              <button 
                onClick={() => createTrendMutation.mutate(formData)}
                disabled={createTrendMutation.isPending || !formData.title || !formData.description}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {createTrendMutation.isPending ? 'Saving...' : 'Save Trend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-32" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-28 bg-white border border-border rounded-xl" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="h-[600px] bg-white border border-border rounded-xl" />
        </div>
      </div>
    </div>
  );
}


