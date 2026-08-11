'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi, campaignsApi } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function EmailPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', audience_id: 1, campaign_id: '' });

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['emails', ORG_ID],
    queryFn: () => emailApi.getEmails(ORG_ID),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', ORG_ID],
    queryFn: () => campaignsApi.getCampaigns(ORG_ID),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => emailApi.createEmail(ORG_ID, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setShowModal(false);
      router.push(`/email/${data.id}`);
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="text-slate-500">Manage and automate your email marketing workflow.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700"
        >
          + Create Campaign
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Audience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Loading...</td></tr>
            ) : emails.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">No email campaigns found.</td></tr>
            ) : (
              emails.map((email: any) => (
                <tr key={email.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/email/${email.id}`} className="text-indigo-600 font-medium hover:underline">
                      {email.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {email.audience_name} ({email.recipient_count || 0} recipients)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      email.status === 'SENT' ? 'bg-green-100 text-green-700' :
                      email.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      email.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                    {email.subject || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Email Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full border-slate-300 rounded p-2 text-sm border"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Summer Sale Newsletter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <select 
                  className="w-full border-slate-300 rounded p-2 text-sm border"
                  value={formData.audience_id}
                  onChange={(e) => setFormData({...formData, audience_id: Number(e.target.value)})}
                >
                  <option value={1}>Newsletter Subscribers</option>
                  <option value={2}>Existing Customers</option>
                  <option value={3}>Leads</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marketing Campaign (Optional)</label>
                <select 
                  className="w-full border-slate-300 rounded p-2 text-sm border"
                  value={formData.campaign_id}
                  onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                >
                  <option value="">-- None --</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
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
                className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
