'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trendsApi } from '@/lib/api/client';
import Link from 'next/link';


export default function TrendsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);

  const { data: trends = [], isLoading } = useQuery({
    queryKey: ['trends', ORG_ID],
    queryFn: () => trendsApi.getTrends(ORG_ID)
  });

  const evaluateMutation = useMutation({
    mutationFn: (trendId: string) => trendsApi.evaluateTrend(ORG_ID, trendId),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading Trends...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trend Analysis & Current Affairs</h1>
          <p className="text-slate-500 text-sm mt-1">Discover trending topics and let AI evaluate their relevance to your Brand Brain.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Current Trends</h2>
          <div className="flex flex-col space-y-3">
            {trends.map((trend: any) => (
              <button
                key={trend.id}
                onClick={() => {
                  setSelectedTrend(trend.id);
                  evaluateMutation.mutate(trend.id);
                }}
                className={`text-left p-4 rounded-lg border transition-all ${selectedTrend === trend.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-slate-900">{trend.title}</span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{trend.category}</span>
                </div>
                <p className="text-sm text-slate-600">{trend.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedTrend ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-full">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span>🤖</span> AI Brand Relevance Evaluation
              </h2>
              
              {evaluateMutation.isPending ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-slate-500 animate-pulse flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing trend against Brand Brain...
                  </div>
                </div>
              ) : evaluateMutation.isError ? (
                <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">
                  Failed to evaluate trend. Is your Brand Profile fully configured?
                </div>
              ) : evaluateMutation.isSuccess && evaluateMutation.data ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex-shrink-0">
                      <div className={`text-3xl font-black ${evaluateMutation.data.relevance_score > 70 ? 'text-green-600' : evaluateMutation.data.relevance_score > 40 ? 'text-yellow-600' : 'text-slate-400'}`}>
                        {evaluateMutation.data.relevance_score}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold text-center mt-1">Score</div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Relevance Analysis</h3>
                      <p className="text-slate-600 text-sm">{evaluateMutation.data.reason}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Recommended Angle</h3>
                    <div className="bg-indigo-50 text-indigo-900 p-4 rounded-lg border border-indigo-100 text-sm">
                      {evaluateMutation.data.recommended_angle}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <span className="text-amber-500">⚠️</span> Safety Considerations
                    </h3>
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-lg border border-amber-100 text-sm">
                      {evaluateMutation.data.safety_considerations}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Link 
                      href={`/campaigns?topic=${encodeURIComponent(trends.find((t:any) => t.id === selectedTrend)?.title || '')}`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Start Campaign with this Trend
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg border border-slate-200 border-dashed h-full min-h-[300px] flex items-center justify-center p-6 text-center text-slate-500">
              <div>
                <div className="text-3xl mb-2">📈</div>
                <p>Select a trend from the list to see how well it aligns with your brand profile and get AI-generated content angles.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
