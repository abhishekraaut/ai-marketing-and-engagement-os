'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandApi, BrandProfile } from '@/lib/api/client';

 // Development placeholder

export default function BrandBrainPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: brand, isLoading, isError } = useQuery({
    queryKey: ['brand', ORG_ID],
    queryFn: () => brandApi.getBrandProfile(ORG_ID),
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

  // When editing starts, populate the form
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
  };

  const mutation = useMutation({
    mutationFn: (data: BrandProfile) => {
      if (brand?.id) {
        return brandApi.updateBrandProfile(ORG_ID, data);
      }
      return brandApi.createBrandProfile(ORG_ID, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', ORG_ID] });
      setIsEditing(false);
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

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Brand Brain...</div>;
  }

  const isConfigured = !!brand?.id;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Brain</h1>
          <p className="text-slate-500">Configure your brand identity and guardrails.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition"
          >
            {isConfigured ? 'Edit Brand' : 'Configure Brand'}
          </button>
        )}
      </div>

      {mutation.isError && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
          Failed to save brand profile. Please try again.
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded shadow border border-slate-200">
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Brand Identity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded p-2 h-24" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Products (comma separated)</label>
                <input value={formData.products?.join(', ')} onChange={e => handleArrayChange(e, 'products')} className="w-full border rounded p-2" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Audience</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Target Audience (comma separated)</label>
              <input value={formData.target_audience?.join(', ')} onChange={e => handleArrayChange(e, 'target_audience')} className="w-full border rounded p-2" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Voice & Messaging</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tone</label>
                <input name="tone" value={formData.tone} onChange={handleChange} placeholder="e.g. Professional, authoritative, friendly" className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Approved Messaging (comma separated)</label>
                <textarea value={formData.approved_messaging?.join(', ')} onChange={e => handleArrayChange(e, 'approved_messaging')} className="w-full border rounded p-2 h-20" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Brand Guardrails</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prohibited Words (comma separated)</label>
                <input value={formData.prohibited_words?.join(', ')} onChange={e => handleArrayChange(e, 'prohibited_words')} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prohibited Claims (comma separated)</label>
                <input value={formData.prohibited_claims?.join(', ')} onChange={e => handleArrayChange(e, 'prohibited_claims')} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Guidelines</label>
                <textarea name="guidelines" value={formData.guidelines} onChange={handleChange} className="w-full border rounded p-2 h-24" />
              </div>
            </div>
          </section>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8 bg-white p-6 rounded shadow border border-slate-200">
          {!isConfigured ? (
            <div className="text-center py-12 text-slate-500">
              Brand Brain is not configured yet. Click &quot;Configure Brand&quot; to get started.
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Brand Identity</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-sm text-slate-500 block">Name</span><span className="font-medium">{brand.name}</span></div>
                  <div><span className="text-sm text-slate-500 block">Description</span><span className="text-sm">{brand.description || '-'}</span></div>
                  <div className="col-span-2"><span className="text-sm text-slate-500 block">Products</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {brand.products?.map((p: string) => <span key={p} className="bg-slate-100 text-xs px-2 py-1 rounded">{p}</span>) || '-'}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Audience</h2>
                <div className="flex flex-wrap gap-2">
                  {brand.target_audience?.map((a: string) => <span key={a} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">{a}</span>) || '-'}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Voice & Messaging</h2>
                <div className="space-y-4">
                  <div><span className="text-sm text-slate-500 block">Tone</span><span>{brand.tone || '-'}</span></div>
                  <div>
                    <span className="text-sm text-slate-500 block">Approved Messaging</span>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                      {brand.approved_messaging?.map((m: string, i: number) => <li key={i}>{m}</li>) || '-'}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Brand Guardrails</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-slate-500 block">Prohibited Words</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {brand.prohibited_words?.map((w: string) => <span key={w} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-100">{w}</span>) || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 block">Prohibited Claims</span>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                      {brand.prohibited_claims?.map((c: string, i: number) => <li key={i}>{c}</li>) || '-'}
                    </ul>
                  </div>
                  <div><span className="text-sm text-slate-500 block">Guidelines</span><p className="text-sm mt-1">{brand.guidelines || '-'}</p></div>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
