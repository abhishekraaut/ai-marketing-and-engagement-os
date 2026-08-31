'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { Lead,  leadsApi } from '@/lib/api/client';
import { UserPlus, Plus, X, } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

const COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'];
const SOURCES = ['SOCIAL', 'EMAIL', 'WEBSITE', 'REFERRAL', 'OTHER'];

export default function LeadsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', source: 'SOCIAL', status: 'NEW', notes: '' });

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', ORG_ID],
    queryFn: () => leadsApi.getLeads(ORG_ID!),
    enabled: !!ORG_ID
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => editingId ? leadsApi.updateLead(ORG_ID!, editingId, data) : leadsApi.createLead(ORG_ID!, data),
    onSuccess: () => {
      // Fire Meta Pixel tracking for Lead Generation
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead');
      }

      queryClient.invalidateQueries({ queryKey: ['leads', ORG_ID] });
      toast({ title: 'Success', description: `Lead ${editingId ? 'updated' : 'created'}.`, type: 'success' });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.deleteLead(ORG_ID!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', ORG_ID] });
      toast({ title: 'Success', description: 'Lead deleted.', type: 'success' });
      setIsModalOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => leadsApi.updateLead(ORG_ID!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', ORG_ID] });
    }
  });

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', source: 'SOCIAL', status: 'NEW', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setFormData({ name: lead.name, email: lead.email || '', phone: lead.phone || '', source: lead.source || 'SOCIAL', status: lead.status || 'NEW', notes: lead.notes || '' });
    setIsModalOpen(true);
  };

  if (!ORG_ID || isLoading) return <div className="p-8 animate-pulse bg-white h-[600px] rounded-xl border border-border">Loading leads...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            Lead Management
          </h1>
          <p className="page-description">Track and move prospects through the conversion pipeline.</p>
        </div>
        
        <button 
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto app-scrollbar max-w-full pb-4 flex-1 items-start app-scrollbar">
        {COLUMNS.map((col) => {
          const colLeads = (leads || []).filter((l: Lead) => l.status === col);
          
          return (
            <div key={col} className="bg-muted rounded-xl min-w-[300px] w-[300px] flex flex-col max-h-full border border-border/50 shadow-sm shrink-0">
              <div className="p-3 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted rounded-t-xl">
                <h3 className="font-bold text-slate-700 text-sm tracking-wide">{col.replace('_', ' ')}</h3>
                <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded-full text-muted-foreground border shadow-sm">
                  {colLeads.length}
                </span>
              </div>
              
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {colLeads.map((lead: Lead) => (
                  <div 
                    key={lead.id} 
                    onClick={() => openEdit(lead)}
                    className="bg-white p-3.5 rounded-lg border border-border shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group relative"
                  >
                    <div className="font-bold text-foreground text-sm mb-1">{lead.name}</div>
                    <div className="text-xs text-muted-foreground truncate mb-3">{lead.email || lead.phone || 'No contact info'}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-muted text-slate-600 rounded">
                        {lead.source}
                      </span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select 
                          className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-0 rounded px-1.5 py-0.5"
                          value={lead.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: lead.id, status: e.target.value });
                          }}
                        >
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm font-medium">
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{editingId ? 'Edit Lead' : 'New Lead'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <select 
                    value={formData.source} 
                    onChange={e => setFormData({...formData, source: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {COLUMNS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Sales notes..."
                />
              </div>
            </div>
            
            <div className="p-6 bg-muted border-t border-border flex justify-between gap-3">
              {editingId ? (
                <button 
                  onClick={() => { if(confirm('Delete lead?')) deleteMutation.mutate(editingId) }} 
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete Lead
                </button>
              ) : <div></div>}
              
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-foreground">
                  Cancel
                </button>
                <button 
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={saveMutation.isPending || !formData.name}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


