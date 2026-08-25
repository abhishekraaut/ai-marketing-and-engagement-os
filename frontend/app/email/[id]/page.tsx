'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaign,  emailApi } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Send, Clock, Edit3, X, CheckCircle2, BarChart3, LayoutTemplate, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function EmailDetail() {
  const { currentOrgId: ORG_ID } = useAuth();
  const { id } = useParams();
  // const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const emailId = Number(id);

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', ORG_ID, emailId],
    queryFn: () => emailApi.getEmail(ORG_ID!, emailId),
    enabled: !!ORG_ID
  });

  const { data: analytics } = useQuery({
    queryKey: ['email_analytics', ORG_ID, emailId],
    queryFn: () => emailApi.getAnalytics(ORG_ID!, emailId),
    enabled: !!ORG_ID && email?.status === 'SENT'
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ subject: '', preview_text: '', body: '', cta: '' });
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (email) {
      setTimeout(() => {
        setFormData({
          subject: email.subject || '',
          preview_text: email.preview_text || '',
          body: email.body || '',
          cta: email.cta || ''
        });
      }, 0);
    }
  }, [email]);

  const generateMutation = useMutation({
    mutationFn: () => emailApi.generateEmail(ORG_ID!, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      setEditMode(true);
      toast({ title: 'AI Generation Complete', description: 'Draft generated based on your Brand Brain.', type: 'success' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmailCampaign>) => emailApi.updateEmail(ORG_ID!, emailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      setEditMode(false);
      toast({ title: 'Email Saved', description: 'Your edits have been stored.', type: 'success' });
    }
  });

  const approveMutation = useMutation({
    mutationFn: () => emailApi.approveEmail(ORG_ID!, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      toast({ title: 'Content Approved', description: 'Email is ready to be published.', type: 'success' });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: (date: string) => emailApi.scheduleEmail(ORG_ID!, emailId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      toast({ title: 'Email Scheduled', description: 'Your campaign has been queued.', type: 'success' });
    }
  });

  const sendMutation = useMutation({
    mutationFn: () => emailApi.sendEmail(ORG_ID!, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      toast({ title: 'Campaign Sent!', description: 'Your email has been dispatched to the audience.', type: 'success' });
    }
  });

  if (!ORG_ID || isLoading) return <EmailEditorSkeleton />;
  if (!email) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">!</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Campaign Not Found</h2>
      <p className="text-slate-500 mb-6">This email campaign might have been deleted or does not exist.</p>
      <Link href="/email" className="text-indigo-600 font-bold hover:underline">Return to Campaigns</Link>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <Link href="/email" className="text-slate-400 hover:text-indigo-600 font-medium text-sm flex items-center gap-1.5 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Campaigns
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{email.name}</h1>
            <StatusBadge status={email.status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1.5 font-medium">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {email.audience_name}</span>
            <span>•</span>
            <span>ID: {email.id}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        
        {/* Left Pane - Editor & Flow */}
        <div className="w-full lg:w-5/12 xl:w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 pb-8 scrollbar-hide">
          
          {email.status === 'DRAFT' && !email.body && !editMode && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Generate Campaign Content</h2>
              <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
                Let AI draft an engaging email based on your Brand Brain identity and target audience parameters.
              </p>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="group relative overflow-hidden bg-purple-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 disabled:opacity-50 w-full sm:w-auto"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center justify-center gap-2 relative z-10">
                  {generateMutation.isPending ? 'Analyzing context...' : <><Sparkles className="w-5 h-5" /> Draft with AI</>}
                </span>
              </button>
            </div>
          )}

          {(editMode || (email.body && ['DRAFT', 'APPROVED'].includes(email.status))) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-indigo-600" /> Content Editor
                </h2>
                {!editMode && email.status === 'DRAFT' && (
                  <button onClick={() => setEditMode(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Line</label>
                  <input 
                    type="text" 
                    disabled={!editMode}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-500"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Preview Text <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input 
                    type="text" 
                    disabled={!editMode}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-500"
                    value={formData.preview_text}
                    onChange={(e) => setFormData({...formData, preview_text: e.target.value})}
                  />
                </div>
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Body</label>
                  <textarea 
                    disabled={!editMode}
                    className="flex-1 w-full border-2 border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-500 resize-none leading-relaxed"
                    value={formData.body}
                    onChange={(e) => setFormData({...formData, body: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Call to Action (CTA) Button</label>
                  <input 
                    type="text" 
                    disabled={!editMode}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-500"
                    value={formData.cta}
                    onChange={(e) => setFormData({...formData, cta: e.target.value})}
                    placeholder="e.g. Shop the Sale"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 border-t border-slate-100 shrink-0 flex justify-end gap-3">
                {email.status === 'DRAFT' && !editMode && (
                  <button 
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Content
                  </button>
                )}
                {editMode && (
                  <>
                    <button onClick={() => {
                      setFormData({
                        subject: email.subject || '', preview_text: email.preview_text || '', body: email.body || '', cta: email.cta || ''
                      });
                      setEditMode(false);
                    }} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all flex items-center gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button 
                      onClick={() => updateMutation.mutate(formData)}
                      disabled={updateMutation.isPending}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {email.status === 'APPROVED' && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden shrink-0">
              <div className="p-5 border-b border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-900">Publishing Center</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <input 
                    type="datetime-local" 
                    className="border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium flex-1 transition-all"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <button 
                    onClick={() => scheduleMutation.mutate(new Date(scheduleDate).toISOString())}
                    disabled={!scheduleDate || scheduleMutation.isPending}
                    className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <Clock className="w-4 h-4" /> Schedule
                  </button>
                </div>
                
                <div className="relative flex items-center py-2 mb-6">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or publish immediately</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                
                <button 
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                  className="w-full bg-emerald-600 text-white px-4 py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm shadow-emerald-200 transition-all text-base"
                >
                  <Send className="w-5 h-5" /> Launch Campaign
                </button>
              </div>
            </div>
          )}
          
          {analytics && email.status === 'SENT' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
               <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Campaign Analytics</h2>
               </div>
               <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50">
                 <StatBox label="Recipients" value={analytics.recipient_count} />
                 <StatBox label="Delivered" value={analytics.delivered} sub={`${(analytics.delivered/analytics.recipient_count*100).toFixed(1)}% Delivery Rate`} />
                 <StatBox label="Open Rate" value={`${analytics.open_rate}%`} sub={`${analytics.opened} Unique Opens`} />
                 <StatBox label="Click Rate" value={`${analytics.click_rate}%`} sub={`${analytics.clicked} Total Clicks`} />
               </div>
            </div>
          )}
        </div>

        {/* Right Pane - Visual Preview */}
        <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col min-h-0 bg-slate-100 rounded-3xl border-4 border-slate-200 shadow-inner overflow-hidden relative">
          
          {/* Mac/Browser Chrome Header */}
          <div className="h-12 bg-slate-200/80 backdrop-blur flex items-center px-4 shrink-0 border-b border-slate-300">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400 shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-inner"></div>
            </div>
            <div className="mx-auto bg-white/50 px-4 py-1 rounded-md text-[11px] font-bold text-slate-500 shadow-sm">
              Email Client Preview
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 flex flex-col scrollbar-hide">
            <div className="max-w-xl w-full mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden flex flex-col shrink-0 animate-in zoom-in-95 duration-300">
              
              {/* Email Envelope Info */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white">
                <div className="text-lg font-bold text-slate-900 mb-2">{formData.subject || 'New Email Campaign'}</div>
                <div className="flex flex-col gap-1 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 w-12">From:</span> 
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">Acme Corp &lt;hello@acme.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 w-12">To:</span> 
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{email.audience_name}</span>
                  </div>
                </div>
              </div>
              
              {/* Actual Email Body Rendering */}
              <div className="p-8 md:p-12 bg-white flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-8">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                  {email.organization?.name || 'Acme Corp'}
                </h1>
                
                <div className="w-full whitespace-pre-wrap text-slate-700 text-base leading-relaxed mb-10 text-center font-medium">
                  {formData.body || <span className="text-slate-400 italic">Generate or write content to see preview...</span>}
                </div>
                
                {formData.cta && (
                  <button className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 mb-12">
                    {formData.cta}
                  </button>
                )}
                
                <div className="w-full border-t border-slate-100 pt-8 mt-auto text-center text-[11px] font-medium text-slate-400 space-y-4">
                  {formData.preview_text && (
                    <div className="text-slate-500 italic max-w-xs mx-auto">&quot;{formData.preview_text}&quot;</div>
                  )}
                  <div>
                    © {new Date().getFullYear()} {email.organization?.name || 'Acme Corp'}. All rights reserved.<br/>
                    123 Marketing Way, Suite 100, Tech City<br/><br/>
                    You are receiving this because you opted in. <a href="#" className="underline hover:text-indigo-600 transition-colors">Unsubscribe</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SENT') {
    return <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"><Send className="w-3.5 h-3.5" /> Sent</span>;
  }
  if (status === 'SCHEDULED') {
    return <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Scheduled</span>;
  }
  if (status === 'APPROVED') {
    return <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
  }
  if (status === 'DRAFT' || status === 'DRAFT_GENERATED') {
    return <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"><Edit3 className="w-3.5 h-3.5" /> Draft</span>;
  }
  return <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{status}</span>;
}

function StatBox({ label, value, sub }: { label: string, value: string | number, sub?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">{label}</div>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs font-medium text-indigo-600 mt-2 bg-indigo-50 inline-flex px-2 py-1 rounded-md self-start">{sub}</div>}
    </div>
  );
}

function EmailEditorSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-4 bg-slate-100 rounded w-48" />
        </div>
      </div>
      <div className="flex flex-1 gap-6">
        <div className="w-1/2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="h-6 bg-slate-100 rounded w-48" />
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl" />)}
            <div className="h-40 bg-slate-50 rounded-xl" />
          </div>
        </div>
        <div className="w-1/2 bg-slate-100 rounded-3xl border-4 border-slate-200" />
      </div>
    </div>
  );
}
