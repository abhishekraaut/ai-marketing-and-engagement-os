'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi, campaignsApi } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Users, LayoutTemplate, Clock, Send, Sparkles, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function EmailPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', audience_id: 1, campaign_id: '' });

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['emails', ORG_ID],
    queryFn: () => emailApi.getEmails(ORG_ID!),
    enabled: !!ORG_ID
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', ORG_ID],
    queryFn: () => campaignsApi.getCampaigns(ORG_ID!),
    enabled: !!ORG_ID
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => emailApi.createEmail(ORG_ID!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setShowModal(false);
      toast({ title: 'Campaign Created', description: 'Redirecting to email editor...', type: 'success' });
      router.push(`/email/${data.id}`);
    },
    onError: () => {
      toast({ title: 'Creation Failed', description: 'Could not create email campaign.', type: 'error' });
    }
  });

  if (!ORG_ID) return <EmailSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Email Campaigns
          </h1>
          <p className="text-slate-500 mt-1">Manage and automate your email marketing workflow with AI generation.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1,2,3].map(i => (
              <div key={i} className="p-6 flex items-center justify-between animate-pulse">
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-48" />
                  <div className="h-4 bg-slate-100 rounded w-64" />
                </div>
                <div className="h-8 bg-slate-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No email campaigns yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Create your first email campaign to start engaging with your audience.
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 relative"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {emails.map((email: any) => (
                  <tr key={email.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <Link href={`/email/${email.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                            {email.name}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5">ID: {email.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{email.audience_name}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{email.recipient_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <div className="max-w-xs truncate text-slate-700 font-medium">
                        {email.subject || <span className="text-slate-400 italic">No subject set</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/email/${email.id}`}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Edit <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">New Email Campaign</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure your audience and links.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Campaign Name</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Q3 Product Update Announcement"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Audience</label>
                <select 
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium bg-white transition-all appearance-none cursor-pointer"
                  value={formData.audience_id}
                  onChange={(e) => setFormData({...formData, audience_id: Number(e.target.value)})}
                >
                  <option value={1}>Newsletter Subscribers</option>
                  <option value={2}>Existing Customers</option>
                  <option value={3}>Leads (Top of Funnel)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Parent Marketing Campaign <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select 
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium bg-white transition-all appearance-none cursor-pointer"
                  value={formData.campaign_id}
                  onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                >
                  <option value="">-- No Parent Campaign --</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Link this email to an overarching campaign to inherit its context and goals for AI generation.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => createMutation.mutate({
                  name: formData.name,
                  audience_id: formData.audience_id,
                  campaign_id: formData.campaign_id ? Number(formData.campaign_id) : null
                })}
                disabled={!formData.name || createMutation.isPending}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-all"
              >
                {createMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>Create Email <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SENT') {
    return <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"><Send className="w-3 h-3" /> Sent</span>;
  }
  if (status === 'SCHEDULED') {
    return <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"><Clock className="w-3 h-3" /> Scheduled</span>;
  }
  if (status === 'APPROVED') {
    return <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
  }
  if (status === 'DRAFT_GENERATED') {
    return <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"><Sparkles className="w-3 h-3" /> AI Draft</span>;
  }
  return <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
}

function EmailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-10 bg-slate-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-12 bg-slate-50 border-b border-slate-100" />
        <div className="divide-y divide-slate-100">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-48" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
