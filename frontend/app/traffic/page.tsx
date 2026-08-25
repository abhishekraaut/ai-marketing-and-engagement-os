'use client';

import React, { useState } from 'react';
import { Download, RefreshCcw, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function WebTrafficPage() {
  const [activeTab, setActiveTab] = useState<'umami' | 'matomo' | 'ga' | 'clarity'>('umami');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: 'Data Refreshed',
        description: 'Web traffic analytics have been updated.',
        type: 'success'
      });
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: 'Export Complete',
        description: `Web traffic data from ${activeTab.toUpperCase()} has been downloaded.`,
        type: 'success'
      });
      // Simulate download
      const element = document.createElement("a");
      const file = new Blob(["Date,Visitors,Pageviews,Bounces\n2023-10-01,150,300,45\n2023-10-02,200,450,50"], {type: 'text/csv'});
      element.href = URL.createObjectURL(file);
      element.download = `${activeTab}_traffic_report.csv`;
      document.body.appendChild(element);
      element.click();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="flex justify-between items-center p-6 border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Web Traffic Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor traffic, behavior, and engagement across all your connected sites.
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Data (CSV)'}</span>
          </button>
        </div>
      </header>

      <div className="px-6 pt-4 shrink-0 bg-white border-b border-slate-200">
        <div className="flex space-x-6">
          {[
            { id: 'umami', name: 'Umami (Privacy-focused)' },
            { id: 'matomo', name: 'Matomo (On-Premise)' },
            { id: 'ga', name: 'Google Analytics' },
            { id: 'clarity', name: 'Microsoft Clarity (Heatmaps)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'umami' | 'matomo' | 'ga' | 'clarity')}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {activeTab === 'umami' && (
            <div className="flex-1 w-full h-full relative">
              <div className="absolute top-2 right-2 flex space-x-2 z-10">
                <a href={process.env.NEXT_PUBLIC_UMAMI_URL || "https://us.umami.is"} target="_blank" rel="noreferrer" className="bg-white/80 p-2 rounded-md shadow-sm hover:bg-white text-slate-600 border border-slate-200 flex items-center space-x-1 text-xs font-medium">
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Umami App</span>
                </a>
              </div>
              <iframe 
                src={`${process.env.NEXT_PUBLIC_UMAMI_URL || "https://us.umami.is"}/share/mock_umami_id/dashboard`} 
                className="w-full h-full border-0"
                title="Umami Dashboard"
              />
            </div>
          )}

          {activeTab === 'matomo' && (
            <div className="flex-1 w-full h-full relative">
              <div className="absolute top-2 right-2 flex space-x-2 z-10">
                <a href={process.env.NEXT_PUBLIC_MATOMO_URL || "https://matomo.org"} target="_blank" rel="noreferrer" className="bg-white/80 p-2 rounded-md shadow-sm hover:bg-white text-slate-600 border border-slate-200 flex items-center space-x-1 text-xs font-medium">
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Matomo App</span>
                </a>
              </div>
              <iframe 
                src={`${process.env.NEXT_PUBLIC_MATOMO_URL || "https://matomo.org"}/index.php?module=Widgetize&action=iframe&moduleToWidgetize=Dashboard&actionToWidgetize=index&idSite=1&period=day&date=yesterday`} 
                className="w-full h-full border-0"
                title="Matomo Dashboard"
              />
            </div>
          )}

          {activeTab === 'ga' && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M4 11h4v11H4zM10 3h4v19h-4zM16 16h4v6h-4z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Google Analytics Integration Active</h2>
              <p className="text-slate-500 max-w-md mb-8">
                Your tracking tag (G-XXXXXXXXXX) is successfully injected into the site. Real-time data is flowing to your Google Analytics property.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8 text-left">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-sm font-medium mb-1">Active Users Right Now</p>
                  <p className="text-3xl font-bold text-slate-800">124</p>
                  <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
                    ↑ 12% vs last hour
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-sm font-medium mb-1">Top Page</p>
                  <p className="text-xl font-bold text-slate-800 truncate">/campaigns/summer-sale</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium flex items-center">
                    45 active viewers
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-sm font-medium mb-1">Top Source</p>
                  <p className="text-xl font-bold text-slate-800">instagram.com</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium flex items-center">
                    Campaign tracking enabled
                  </p>
                </div>
              </div>

              <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <ExternalLink className="w-5 h-5" />
                <span>Open Google Analytics</span>
              </a>
            </div>
          )}

          {activeTab === 'clarity' && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Microsoft Clarity Heatmaps</h2>
              <p className="text-slate-500 max-w-md mb-8">
                Session recording and heatmaps are currently active. Clarity is collecting click, scroll, and movement data for your project.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 aspect-video flex items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-red-500/20 mix-blend-multiply opacity-50 blur-xl"></div>
                   <div className="relative z-10 text-center">
                     <p className="font-semibold text-slate-700">Click Heatmaps</p>
                     <p className="text-xs text-slate-500 mt-1">Capturing interaction hotspots</p>
                   </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 aspect-video flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 flex flex-col justify-between opacity-20">
                     <div className="w-full h-8 bg-red-500"></div>
                     <div className="w-full h-16 bg-yellow-500"></div>
                     <div className="w-full h-32 bg-green-500"></div>
                     <div className="w-full h-64 bg-blue-500"></div>
                   </div>
                   <div className="relative z-10 text-center">
                     <p className="font-semibold text-slate-700">Scroll Depth</p>
                     <p className="text-xs text-slate-500 mt-1">Tracking visitor engagement</p>
                   </div>
                 </div>
              </div>

              <a href="https://clarity.microsoft.com" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                <ExternalLink className="w-5 h-5" />
                <span>View Dashboard in Clarity</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


