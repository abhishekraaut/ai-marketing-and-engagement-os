'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '@/lib/api/client';
import Link from 'next/link';


export default function EmailDetail() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const emailId = Number(id);

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', ORG_ID, emailId],
    queryFn: () => emailApi.getEmail(ORG_ID, emailId),
  });

  const { data: analytics } = useQuery({
    queryKey: ['email_analytics', ORG_ID, emailId],
    queryFn: () => emailApi.getAnalytics(ORG_ID, emailId),
    enabled: email?.status === 'SENT'
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ subject: '', preview_text: '', body: '', cta: '' });
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (email) {
      setFormData({
        subject: email.subject || '',
        preview_text: email.preview_text || '',
        body: email.body || '',
        cta: email.cta || ''
      });
    }
  }, [email]);

  const generateMutation = useMutation({
    mutationFn: () => emailApi.generateEmail(ORG_ID, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      setEditMode(true);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => emailApi.updateEmail(ORG_ID, emailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] });
      setEditMode(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: () => emailApi.approveEmail(ORG_ID, emailId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] })
  });

  const scheduleMutation = useMutation({
    mutationFn: (date: string) => emailApi.scheduleEmail(ORG_ID, emailId, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] })
  });

  const sendMutation = useMutation({
    mutationFn: () => emailApi.sendEmail(ORG_ID, emailId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email', ORG_ID, emailId] })
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!email) return <div className="p-8 text-center text-red-500">Email not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 flex gap-6">
      {/* Left Pane - Editor & Flow */}
      <div className="w-1/2 flex flex-col gap-6">
        <div>
          <Link href="/email" className="text-indigo-600 text-sm hover:underline mb-2 inline-block">← Back to Campaigns</Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">{email.name}</h1>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              email.status === 'SENT' ? 'bg-green-100 text-green-700' :
              email.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
              email.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {email.status}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Audience: {email.audience_name}</p>
        </div>

        {email.status === 'DRAFT' && !email.body && !editMode && (
          <div className="bg-white rounded-lg shadow p-8 text-center border border-slate-200">
            <p className="text-slate-600 mb-4">Start by generating AI content based on your Brand Brain and Audience.</p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Generating...' : '✨ Generate Email Content'}
            </button>
          </div>
        )}

        {(editMode || (email.body && ['DRAFT', 'APPROVED'].includes(email.status))) && (
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Email Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  disabled={!editMode}
                  className="w-full border-slate-300 rounded p-2 text-sm border disabled:bg-slate-50"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preview Text</label>
                <input 
                  type="text" 
                  disabled={!editMode}
                  className="w-full border-slate-300 rounded p-2 text-sm border disabled:bg-slate-50"
                  value={formData.preview_text}
                  onChange={(e) => setFormData({...formData, preview_text: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Body</label>
                <textarea 
                  rows={8}
                  disabled={!editMode}
                  className="w-full border-slate-300 rounded p-2 text-sm border disabled:bg-slate-50"
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Call to Action (CTA)</label>
                <input 
                  type="text" 
                  disabled={!editMode}
                  className="w-full border-slate-300 rounded p-2 text-sm border disabled:bg-slate-50"
                  value={formData.cta}
                  onChange={(e) => setFormData({...formData, cta: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              {email.status === 'DRAFT' && !editMode && (
                <>
                  <button onClick={() => setEditMode(true)} className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">
                    Edit
                  </button>
                  <button 
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve Content
                  </button>
                </>
              )}
              {editMode && (
                <>
                  <button onClick={() => {
                    setFormData({
                      subject: email.subject || '', preview_text: email.preview_text || '', body: email.body || '', cta: email.cta || ''
                    });
                    setEditMode(false);
                  }} className="px-4 py-2 text-slate-600 hover:text-slate-800">
                    Cancel
                  </button>
                  <button 
                    onClick={() => updateMutation.mutate(formData)}
                    disabled={updateMutation.isPending}
                    className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {email.status === 'APPROVED' && (
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Publishing</h2>
            <div className="flex gap-4 mb-4">
              <input 
                type="datetime-local" 
                className="border-slate-300 rounded p-2 text-sm border flex-1"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <button 
                onClick={() => scheduleMutation.mutate(new Date(scheduleDate).toISOString())}
                disabled={!scheduleDate || scheduleMutation.isPending}
                className="bg-slate-800 text-white px-4 py-2 rounded font-medium hover:bg-slate-900 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <button 
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="w-full bg-green-600 text-white px-4 py-3 rounded font-medium hover:bg-green-700 disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
            >
              🚀 Send Now (Mock)
            </button>
          </div>
        )}
        
        {analytics && email.status === 'SENT' && (
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
             <h2 className="text-lg font-bold text-slate-800 mb-4">Campaign Analytics</h2>
             <div className="grid grid-cols-2 gap-4">
               <StatBox label="Recipients" value={analytics.recipient_count} />
               <StatBox label="Delivered" value={analytics.delivered} sub={`${(analytics.delivered/analytics.recipient_count*100).toFixed(1)}%`} />
               <StatBox label="Open Rate" value={`${analytics.open_rate}%`} sub={`${analytics.opened} opens`} />
               <StatBox label="Click Rate" value={`${analytics.click_rate}%`} sub={`${analytics.clicked} clicks`} />
             </div>
          </div>
        )}
      </div>

      {/* Right Pane - Visual Preview */}
      <div className="w-1/2">
        <div className="sticky top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Inbox Preview</h2>
          
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            {/* Fake Email Client Header */}
            <div className="bg-slate-100 p-4 border-b border-slate-200">
              <div className="flex gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="text-sm font-semibold text-slate-800 mb-1">{formData.subject || 'New Email'}</div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>From: Acme Corp &lt;hello@acme.com&gt;</span>
                <span>To: {email.audience_name}</span>
              </div>
            </div>
            
            {/* Fake Email Body */}
            <div className="p-8 bg-slate-50 min-h-[400px]">
              <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm">
                <div className="text-center font-bold text-slate-800 text-xl mb-6 pb-4 border-b border-slate-100">
                  {email.organization?.name || 'Acme Corp'}
                </div>
                
                <div className="whitespace-pre-wrap text-slate-700 text-[15px] leading-relaxed mb-8">
                  {formData.body || 'Email body will appear here...'}
                </div>
                
                {formData.cta && (
                  <div className="text-center">
                    <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium text-sm">
                      {formData.cta}
                    </button>
                  </div>
                )}
                
                <div className="mt-12 text-center text-xs text-slate-400">
                  {formData.preview_text}
                  <br/><br/>
                  You are receiving this because you opted in. <a href="#" className="underline">Unsubscribe</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string, value: string | number, sub?: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
