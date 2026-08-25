'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { socialAccountsApi, contentApi } from '@/lib/api/client';
import { Send, Image as ImageIcon, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ContentPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isReel, setIsReel] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts', ORG_ID],
    queryFn: () => socialAccountsApi.getAccounts(ORG_ID!),
    enabled: !!ORG_ID
  });

  const publishMutation = useMutation({
     
    mutationFn: (data: Record<string, unknown>) => contentApi.publishContent(ORG_ID!, data),
     
    onSuccess: (res: { published_count?: number }) => {
      toast({ title: 'Success', description: `Successfully published ${res.published_count} posts.`, type: 'success' });
      router.push('/analytics');
    }
  });

  const handlePublish = () => {
    if (!title || !body || selectedAccounts.length === 0) {
      toast({ title: 'Validation Error', description: 'Title, Body, and at least one account are required.', type: 'error' });
      return;
    }
    
    // get platforms from selected accounts
    const platforms = Array.from(new Set(
     
      accounts?.filter((a: { id: number; platform: string }) => selectedAccounts.includes(a.id)).map((a: { id: number; platform: string }) => a.platform) || []
    ));

    publishMutation.mutate({
      title,
      body,
      media_url: mediaUrl,
      is_reel: isReel,
      platforms,
      account_ids: selectedAccounts
    });
  };

  const toggleAccount = (id: number) => {
    if (selectedAccounts.includes(id)) {
      setSelectedAccounts(selectedAccounts.filter(a => a !== id));
    } else {
      setSelectedAccounts([...selectedAccounts, id]);
    }
  };

  if (!ORG_ID) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Post Composer</h1>
          <p className="text-slate-500 mt-1">Create and publish content across multiple platforms simultaneously.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
        
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Campaign / Post Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            placeholder="e.g. Summer Sale Announcement"
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Caption / Body</label>
          <textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all min-h-[150px]"
            placeholder="Write your post caption here..."
          />
        </div>

        {/* Media */}
        <div className="space-y-4 p-4 border border-slate-100 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            Media & Formats
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Media URL (Optional)</label>
            <input 
              type="text" 
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isReel} 
                onChange={(e) => setIsReel(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <Video className="w-4 h-4 text-slate-400" />
              Publish as Short/Reel (requires video URL)
            </label>
          </div>
        </div>

        {/* Accounts Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Publish To Accounts</label>
          {accountsLoading ? (
            <div className="animate-pulse h-12 bg-slate-100 rounded-lg w-full" />
          ) : !accounts || accounts.length === 0 ? (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No social accounts connected. Connect accounts in Settings first.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {accounts.map((acc: { id: number; platform: string; username: string; account_name?: string }) => {
                const isSelected = selectedAccounts.includes(acc.id);
                return (
                  <div 
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      isSelected 
                        ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">{acc.account_name || 'Account'}</div>
                      <div className="text-xs font-semibold text-slate-500">{acc.platform}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handlePublish}
            disabled={publishMutation.isPending || selectedAccounts.length === 0}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {publishMutation.isPending ? 'Publishing...' : 'Publish Post Now'}
          </button>
        </div>

      </div>
    </div>
  );
}


