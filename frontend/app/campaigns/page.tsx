'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, contentApi, schedulesApi, socialAccountsApi, Campaign } from '@/lib/api/client';
import { addDays, formatISO } from 'date-fns';
import { useToast } from '@/components/ui/ToastContext';
import { Megaphone, Calendar, Clock, CheckCircle, XCircle, Sparkles, Send, Layout, Layers, Loader2, Plus, ArrowRight, Activity, MessageSquare } from 'lucide-react';

const AVAILABLE_PLATFORMS = ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X', 'YOUTUBE'];
const AVAILABLE_FORMATS = ['Standard Post', 'Short Video/Reel', 'Long-form Video', 'Thread/Carousel', 'Story'];

export default function CampaignsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Campaign>>({ name: '', objective: '', topic: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['LINKEDIN', 'X', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE']);
  const [selectedFormat, setSelectedFormat] = useState<string>('Standard Post');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('LINKEDIN');
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts', ORG_ID],
    queryFn: () => socialAccountsApi.getAccounts(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', ORG_ID],
    queryFn: () => campaignsApi.getCampaigns(ORG_ID!),
    enabled: !!ORG_ID
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Campaign>) => campaignsApi.createCampaign(ORG_ID!, data),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['campaigns', ORG_ID] });
      toast({ title: 'Campaign Created', description: 'Your new campaign is ready.', type: 'success' });
      setTimeout(() => {
        setIsCreating(false);
        setFormData({ name: '', objective: '', topic: '' });
        setSaveStatus('idle');
      }, 1000);
    },
    onError: (error: any) => {
      setSaveStatus('error');
      toast({ title: 'Creation Failed', description: error.message, type: 'error' });
    }
  });

  const generateMutation = useMutation({
    mutationFn: (data: { campaignId: number, platforms: string[], format: string }) =>
      campaignsApi.generateCampaignContent(ORG_ID!, data.campaignId, data.platforms, data.format),
    onSuccess: (data) => {
      setGeneratedContent(data);
      if (data.variants && data.variants.length > 0) {
        setActiveTab(data.variants[0].platform);
      }
      toast({ title: 'Content Generated', description: 'Review your new variants.', type: 'success' });
    },
    onError: (error: Error) => toast({ title: 'Generation Failed', description: error.message, type: 'error' })
  });

  const actionMutation = useMutation({
    mutationFn: (data: { action: string, contentId: number, variantId: number, payload?: any }) => {
      if (data.action === 'submit') return contentApi.submitReview(ORG_ID!, data.contentId, data.variantId);
      if (data.action === 'approve') return contentApi.approve(ORG_ID!, data.contentId, data.variantId);
      if (data.action === 'reject') return contentApi.reject(ORG_ID!, data.contentId, data.variantId, 'Rejected by user');
      if (data.action === 'schedule') return schedulesApi.scheduleVariant(ORG_ID!, data.variantId, data.payload);
      throw new Error("Invalid action");
    },
    onSuccess: (updatedVariant: any, variables) => {
      setGeneratedContent((prev: any) => {
        if (!prev) return prev;
        const newVariants = prev.variants.map((v: any) => {
          if (variables.action === 'schedule' && v.platform === activeTab) {
             return { ...v, status: 'SCHEDULED' };
          }
          if (v.id === updatedVariant.id || v.platform === activeTab) {
             return { ...v, status: updatedVariant.status || 'SCHEDULED' }; 
          }
          return v;
        });
        return { ...prev, variants: newVariants };
      });
      toast({ title: 'Action Successful', description: `Variant updated successfully.`, type: 'success' });
    },
    onError: (error: Error) => toast({ title: 'Action Failed', description: error.message, type: 'error' })
  });

  const handleAction = (action: string, variant: any) => {
    if (action === 'schedule') {
       if (!scheduleData.date || !scheduleData.time) {
          toast({ title: 'Missing Date/Time', description: 'Please pick a date and time', type: 'error' });
          return;
       }
       const dt = new Date(`${scheduleData.date}T${scheduleData.time}`);
       actionMutation.mutate({
         action, 
         contentId: generatedContent.content_item_id, 
         variantId: variant.id || 1,
         payload: {
           social_account_id: accounts?.[0]?.id || 1,
           scheduled_at: formatISO(dt),
           timezone: "UTC"
         }
       });
    } else {
       actionMutation.mutate({
         action, 
         contentId: generatedContent.content_item_id, 
         variantId: variant.id || 1
       });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">APPROVED</span>;
      case 'IN_REVIEW': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">IN REVIEW</span>;
      case 'SCHEDULED': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">SCHEDULED</span>;
      case 'REJECTED': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">REJECTED</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
    }
  };

  if (!ORG_ID) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-600" />
            Campaigns
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Manage multi-platform marketing campaigns seamlessly.</p>
        </div>
        {!isCreating && !selectedCampaign && (
          <button onClick={() => { setIsCreating(true); setSaveStatus('idle'); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg"><Layers className="w-5 h-5 text-indigo-600" /></div>
            <h2 className="text-xl font-bold text-slate-800">New Campaign Setup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Campaign Name <span className="text-rose-500">*</span></label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="e.g. Q4 Product Launch" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Objective</label>
              <input value={formData.objective} onChange={e => setFormData({ ...formData, objective: e.target.value })} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="e.g. Drive awareness" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Topic / Focus</label>
              <input value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="e.g. New AI features" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saveStatus === 'saving' || saveStatus === 'saved'} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2 min-w-[150px] justify-center">
              {saveStatus === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saveStatus === 'saved' ? <><CheckCircle className="w-4 h-4" /> Created</> : 'Create Campaign'}
            </button>
          </div>
        </form>
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg"><Sparkles className="w-5 h-5 text-indigo-700" /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Content Studio</h2>
                  <p className="text-sm text-slate-500">Campaign: <span className="font-semibold text-slate-700">{selectedCampaign.name}</span></p>
                </div>
              </div>
              <button onClick={() => { setSelectedCampaign(null); setGeneratedContent(null); }} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30">
              {!generatedContent && !generateMutation.isPending && (
                <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Target Platforms</h3>
                    <p className="text-slate-500">Choose where you want to generate tailored content for this campaign.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {AVAILABLE_PLATFORMS.map(platform => (
                      <label key={platform} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPlatforms.includes(platform) ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <Layout className={`w-5 h-5 ${selectedPlatforms.includes(platform) ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-slate-700">{platform}</span>
                        </div>
                        <input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform])} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Select Content Format</h3>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="w-full md:w-1/2 p-3 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                    >
                      {AVAILABLE_FORMATS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="pt-8">
                    <button
                      onClick={() => generateMutation.mutate({ campaignId: selectedCampaign.id, platforms: selectedPlatforms, format: selectedFormat })}
                      disabled={selectedPlatforms.length === 0}
                      className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto gap-2 text-lg disabled:opacity-50"
                    >
                      <Sparkles className="w-5 h-5" /> Generate Content Variations
                    </button>
                  </div>
                </div>
              )}

              {generateMutation.isPending && (
                <div className="py-24 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">Crafting your content...</p>
                    <p className="text-slate-500 mt-1">Applying brand guidelines and optimizing for platforms.</p>
                  </div>
                </div>
              )}

              {generatedContent && (
                <div className="h-full flex flex-col md:flex-row gap-6">
                  {/* Sidebar */}
                  <div className="w-full md:w-64 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Generated Variants</h4>
                    {generatedContent.variants.map((v: any) => (
                      <button key={v.platform} onClick={() => setActiveTab(v.platform)} className={`p-4 rounded-xl text-left border transition-all ${activeTab === v.platform ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-600' : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-bold text-slate-800">{v.platform}</div>
                          {v.status === 'APPROVED' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {v.status === 'SCHEDULED' && <Calendar className="w-4 h-4 text-blue-500" />}
                        </div>
                        {getStatusBadge(v.status)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    {generatedContent.variants.map((v: any) => v.platform === activeTab && (
                      <div key={v.platform} className="flex flex-col h-full">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div className="flex items-center gap-4">
                            {getStatusBadge(v.status)}
                            <span className="text-sm font-medium text-slate-500">Variant ID: {v.id || 'Draft'}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {(!v.status || v.status === 'DRAFT') && (
                              <button onClick={() => handleAction('submit', v)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors">
                                <Send className="w-4 h-4" /> Submit for Review
                              </button>
                            )}
                            {v.status === 'IN_REVIEW' && (
                              <>
                                <button onClick={() => handleAction('reject', v)} className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-50 transition-colors">Reject</button>
                                <button onClick={() => handleAction('approve', v)} className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-colors">Approve Variant</button>
                              </>
                            )}
                            {v.status === 'APPROVED' && (
                              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                                <input type="date" className="text-sm bg-transparent border-r border-slate-200 px-3 outline-none" onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
                                <input type="time" className="text-sm bg-transparent px-3 outline-none" onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
                                <button onClick={() => handleAction('schedule', v)} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
                                  <Clock className="w-4 h-4" /> Schedule
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-8 flex-1 overflow-y-auto">
                          <div className="max-w-2xl mx-auto space-y-8">
                            <div>
                              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                <MessageSquare className="w-4 h-4" /> Post Content
                              </h4>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner font-medium">
                                {v.content}
                              </div>
                            </div>
                            {v.caption && (
                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Image Prompt / Caption</h4>
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-amber-900 italic">
                                  {v.caption}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-2xl">
              <span className="text-sm text-slate-500 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI-generated content follows Brand Guardrails</span>
              <div className="flex space-x-3">
                <button onClick={() => { setSelectedCampaign(null); setGeneratedContent(null); }} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">Close Workspace</button>
                {!generatedContent && (
                  <button onClick={() => generateMutation.mutate({ campaignId: selectedCampaign.id, platforms: selectedPlatforms, format: selectedFormat })} disabled={generateMutation.isPending || selectedPlatforms.length === 0} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                    Generate Flow <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      {!isCreating && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Active Campaigns</h3>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : campaigns?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No campaigns found. Create your first campaign to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Objective</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {campaigns?.map((campaign: Campaign) => (
                    <tr key={campaign.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{campaign.name}</div>
                        <div className="text-sm text-slate-500">{campaign.topic || 'No topic'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {campaign.objective || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">ACTIVE</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => setSelectedCampaign(campaign)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 hover:shadow-sm transition-all">
                          <Sparkles className="w-4 h-4" /> Open Studio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center space-x-2 pt-6 pb-2 text-sm text-slate-500 font-medium justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
        <Activity className="w-4 h-4" />
        <span>Publishing Engine & Celery Beat Active</span>
      </div>
    </div>
  );
}
