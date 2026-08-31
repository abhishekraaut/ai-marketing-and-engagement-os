'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { Audience,  audiencesApi, } from '@/lib/api/client';
import { Users, Plus, Download, Edit2, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function AudiencesPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: audiences, isLoading } = useQuery({
    queryKey: ['audiences', ORG_ID],
    queryFn: () => audiencesApi.getAudiences(ORG_ID!),
    enabled: !!ORG_ID
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Audience>) => editingId ? audiencesApi.updateAudience(ORG_ID!, editingId, data) : audiencesApi.createAudience(ORG_ID!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences', ORG_ID] });
      toast({ title: 'Success', description: `Audience ${editingId ? 'updated' : 'created'} successfully.`, type: 'success' });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => audiencesApi.deleteAudience(ORG_ID!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences', ORG_ID] });
      toast({ title: 'Success', description: 'Audience deleted.', type: 'success' });
    }
  });

  const handleExport = async () => {
    try {
      const { downloadAPI } = await import('@/lib/api/client');
      await downloadAPI(`/organizations/${ORG_ID}/audiences/export`, 'audiences_export.csv');
    } catch (error: unknown) {
      toast({ title: 'Export failed', description: ((error as Error).message || "Error") || 'Could not export data.', type: 'error' });
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (aud: Audience) => {
    setEditingId(aud.id);
    setFormData({ name: aud.name, description: aud.description || '' });
    setIsModalOpen(true);
  };

  if (!ORG_ID || isLoading) return <div className="p-8 animate-pulse bg-white h-96 rounded-xl border border-border">Loading audiences...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Audience Management
          </h1>
          <p className="page-description">Manage target audiences and segments for campaigns.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button 
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Audience
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="app-table-container">
<table className="app-table">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Contacts</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!audiences || audiences.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No audiences found.</td>
              </tr>
            ) : audiences.map((aud: Audience) => (
              <tr key={aud.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">{aud.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{aud.description || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">{aud.contact_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => openEdit(aud)} className="text-indigo-600 hover:text-indigo-900 mx-2 p-1">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if(confirm('Delete audience?')) deleteMutation.mutate(aud.id) }} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{editingId ? 'Edit Audience' : 'New Audience'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  placeholder="e.g. VIP Customers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow min-h-[100px]"
                  placeholder="Detailed description of segment..."
                />
              </div>
            </div>
            <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-foreground">
                Cancel
              </button>
              <button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Audience'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


