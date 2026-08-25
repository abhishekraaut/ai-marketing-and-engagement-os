'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandApi, BrandProfile } from '@/lib/api/client';
import { useToast } from '@/components/ui/ToastContext';
import { Save, Edit2, Shield, Target, Briefcase, X, Loader2, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

export default function BrandBrainPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: brand, isLoading, isError } = useQuery({
    queryKey: ['brand', ORG_ID],
    queryFn: () => brandApi.getBrandProfile(ORG_ID!),
    enabled: !!ORG_ID,
    retry: false
  });

  const [formData, setFormData] = useState<BrandProfile>({
    name: '',
    description: '',
    tone: '',
    guidelines: '',
    products: [],
    target_audience: [],
    approved_messaging: [],
    prohibited_words: [],
    prohibited_claims: [],
  });

  const handleEdit = () => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        tone: brand.tone || '',
        guidelines: brand.guidelines || '',
        products: brand.products || [],
        target_audience: brand.target_audience || [],
        approved_messaging: brand.approved_messaging || [],
        prohibited_words: brand.prohibited_words || [],
        prohibited_claims: brand.prohibited_claims || [],
      });
    }
    setIsEditing(true);
    setSaveStatus('idle');
  };

  const mutation = useMutation({
    mutationFn: (data: BrandProfile) => {
      if (brand?.id) {
        return brandApi.updateBrandProfile(ORG_ID!, data);
      }
      return brandApi.createBrandProfile(ORG_ID!, data);
    },
    onMutate: () => {
      setSaveStatus('saving');
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['brand', ORG_ID] });
      toast({ title: 'Success', description: 'Brand profile saved successfully.', type: 'success' });
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus('idle');
      }, 1000);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      setSaveStatus('error');
      toast({ title: 'Error', description: error?.message || 'Failed to save brand profile.', type: 'error' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof BrandProfile) => {
    const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  if (!ORG_ID) return null;

  const isConfigured = !!brand?.id;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            Brand Brain
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Configure your brand identity and AI guardrails.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            <Edit2 className="w-4 h-4" />
            {isConfigured ? 'Edit Brand' : 'Configure Brand'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg"><Briefcase className="w-5 h-5 text-indigo-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Core Identity</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brand Name <span className="text-rose-500">*</span></label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 h-28 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none" placeholder="What does your company do?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Products (comma separated)</label>
                  <input value={formData.products?.join(', ')} onChange={e => handleArrayChange(e, 'products')} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="Product A, Product B" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Audience & Tone</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Audience (comma separated)</label>
                  <input value={formData.target_audience?.join(', ')} onChange={e => handleArrayChange(e, 'target_audience')} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="Founders, Marketing Managers" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brand Tone</label>
                  <input name="tone" value={formData.tone} onChange={handleChange} placeholder="e.g. Professional, authoritative, friendly" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approved Messaging (comma separated)</label>
                  <textarea value={formData.approved_messaging?.join(', ')} onChange={e => handleArrayChange(e, 'approved_messaging')} className="w-full border border-slate-300 rounded-lg p-2.5 h-20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none" placeholder="Key value propositions..." />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 md:col-span-2 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-rose-50 rounded-lg"><Shield className="w-5 h-5 text-rose-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Brand Guardrails</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prohibited Words (comma separated)</label>
                  <input value={formData.prohibited_words?.join(', ')} onChange={e => handleArrayChange(e, 'prohibited_words')} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none" placeholder="cheap, guaranteed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prohibited Claims (comma separated)</label>
                  <input value={formData.prohibited_claims?.join(', ')} onChange={e => handleArrayChange(e, 'prohibited_claims')} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none" placeholder="#1 in the world, 100% cure" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Guidelines</label>
                  <textarea name="guidelines" value={formData.guidelines} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none" placeholder="Any other strict instructions for the AI..." />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {saveStatus === 'error' && <span className="text-rose-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Error saving</span>}
            {saveStatus === 'saved' && <span className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved successfully</span>}
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="submit" disabled={saveStatus === 'saving' || saveStatus === 'saved'} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2 min-w-[140px] justify-center">
              {saveStatus === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          {!isConfigured ? (
            <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Brand Brain Found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">Configure your brand identity to ensure all AI-generated content aligns perfectly with your voice, audience, and guardrails.</p>
              <button onClick={handleEdit} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all inline-flex items-center gap-2">
                <Edit2 className="w-5 h-5" /> Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg"><Briefcase className="w-5 h-5 text-indigo-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Core Identity</h2>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Brand Name</span><span className="text-slate-900 font-medium text-lg">{brand.name}</span></div>
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span><span className="text-slate-700 leading-relaxed">{brand.description || '-'}</span></div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Products</span>
                    <div className="flex flex-wrap gap-2">
                      {brand.products?.length ? brand.products.map((p: string) => <span key={p} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full font-medium">{p}</span>) : '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Audience & Tone</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Target Audience</span>
                    <div className="flex flex-wrap gap-2">
                      {brand.target_audience?.length ? brand.target_audience.map((a: string) => <span key={a} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm px-3 py-1 rounded-full font-medium">{a}</span>) : '-'}
                    </div>
                  </div>
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tone</span><span className="text-slate-700 font-medium">{brand.tone || '-'}</span></div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Approved Messaging</span>
                    <ul className="space-y-2">
                      {brand.approved_messaging?.length ? brand.approved_messaging.map((m: string, i: number) => (
                        <li key={i} className="flex gap-2 items-start text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {m}</li>
                      )) : '-'}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 md:col-span-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-rose-50 rounded-lg"><Shield className="w-5 h-5 text-rose-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Brand Guardrails</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Prohibited Words</span>
                    <div className="flex flex-wrap gap-2">
                      {brand.prohibited_words?.length ? brand.prohibited_words.map((w: string) => <span key={w} className="bg-rose-50 text-rose-700 border border-rose-100 text-sm px-3 py-1 rounded-full font-medium">{w}</span>) : '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Prohibited Claims</span>
                    <ul className="space-y-2">
                      {brand.prohibited_claims?.length ? brand.prohibited_claims.map((c: string, i: number) => (
                        <li key={i} className="flex gap-2 items-start text-sm text-slate-700"><X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> {c}</li>
                      )) : '-'}
                    </ul>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Additional Guidelines</span>
                    <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">{brand.guidelines || 'No additional guidelines specified.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


