'use client';

import { useState } from 'react';
import { EngagementItem } from '@/lib/api/client';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { engagementApi } from '@/lib/api/client';
import { MessageSquareText, Filter, RefreshCcw, Sparkles, Send, CheckCircle2, Clock, AlertCircle, Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function InboxPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');

  const getParams = () => {
    const params: Record<string, string> = {};
    if (activeFilter === 'NEEDS_REPLY') params.reply_status = 'NEEDS_REPLY';
    if (activeFilter === 'POSITIVE') params.sentiment = 'POSITIVE';
    if (activeFilter === 'NEGATIVE') params.sentiment = 'NEGATIVE';
    if (platformFilter !== 'ALL') params.platform = platformFilter;
    return params;
  };

  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['engagements', ORG_ID, getParams()],
    queryFn: () => engagementApi.getEngagements(ORG_ID!, getParams()),
    enabled: !!ORG_ID
  });

  const syncMutation = useMutation({
    mutationFn: () => engagementApi.syncEngagement(ORG_ID!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Inbox Synced', description: 'Latest messages fetched successfully.', type: 'success' });
    }
  });

  const generateMutation = useMutation({
    mutationFn: (id: number) => engagementApi.generateReply(ORG_ID!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Reply Drafted', description: 'AI has generated a response.', type: 'success' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number, reply: string }) => engagementApi.updateReply(ORG_ID!, id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      setEditMode(false);
      toast({ title: 'Reply Updated', description: 'Your changes have been saved.', type: 'success' });
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => engagementApi.approveReply(ORG_ID!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Reply Approved', description: 'Draft is ready to send.', type: 'success' });
    }
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => engagementApi.sendReply(ORG_ID!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Message Sent', description: 'Your reply has been published.', type: 'success' });
    }
  });

  if (!ORG_ID) return <InboxSkeleton />;

  const selectedItem = engagements.find((e: { id: string | number }) => e.id === selectedId);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-indigo-600" />
            Engagement Inbox
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage, filter, and reply to community interactions with AI assistance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative bg-white rounded-lg shadow-sm border border-border">
            <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-transparent border-0 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer rounded-lg appearance-none"
            >
              <option value="ALL">All Platforms</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="X">X (Twitter)</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-white border border-border text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCcw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
            Sync
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Area */}
      <div className="flex flex-col md:flex-row flex-1 gap-6 min-h-0">

        {/* Left Pane - List */}
        <div className="w-full md:w-5/12 lg:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-border overflow-hidden shrink-0">

          <div className="p-3 border-b border-border bg-muted/50 flex gap-2 overflow-x-auto app-scrollbar max-w-full app-scrollbar shrink-0">
            <FilterBtn label="All" active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
            <FilterBtn label="Needs Reply" active={activeFilter === 'NEEDS_REPLY'} onClick={() => setActiveFilter('NEEDS_REPLY')} />
            <FilterBtn label="Positive" active={activeFilter === 'POSITIVE'} onClick={() => setActiveFilter('POSITIVE')} />
            <FilterBtn label="Negative" active={activeFilter === 'NEGATIVE'} onClick={() => setActiveFilter('NEGATIVE')} />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Loading inbox...</span>
                </div>
              </div>
            ) : engagements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <MessageSquareText className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Inbox Zero</h3>
                <p className="text-xs text-muted-foreground mt-1">No engagements match your current filters.</p>
              </div>
            ) : (
              engagements.map((item: EngagementItem) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setEditMode(false);
                  }}
                  className={cn(
                    "p-4 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                    selectedId === item.id
                      ? "bg-indigo-50/80 border border-indigo-200 shadow-sm"
                      : "bg-white border border-border hover:border-indigo-200 hover:bg-indigo-50/30"
                  )}
                >
                  {selectedId === item.id && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold">
                        {item.author_name.charAt(0)}
                      </div>
                      <span className="font-bold text-foreground text-sm truncate">{item.author_name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 ml-2">{item.platform}</span>
                  </div>
                  <p className={cn(
                    "text-sm line-clamp-2 leading-relaxed mb-3",
                    selectedId === item.id ? "text-slate-700" : "text-slate-600"
                  )}>
                    {item.content}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <SentimentBadge sentiment={item.sentiment || 'NEUTRAL'} />
                    {item.reply_status === 'REPLIED' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sent</span>}
                    {item.reply_status === 'APPROVED' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Approved</span>}
                    {item.reply_status === 'AI_DRAFTED' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Sparkles className="w-3 h-3"/> Draft</span>}
                    {item.reply_status === 'NEEDS_REPLY' && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">Needs Reply</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Detail */}
        <div className="w-full md:w-7/12 lg:w-2/3 bg-white rounded-xl shadow-sm border border-border flex flex-col min-h-[500px] overflow-hidden relative">
          {!selectedItem ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
              <MessageSquareText className="w-12 h-12 text-slate-200 mb-4" />
              <p className="font-medium">Select a conversation to view and reply</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-border bg-white shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">
                      {selectedItem.author_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">{selectedItem.author_name}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-slate-600">{selectedItem.author_handle}</span>
                        <span>•</span>
                        <span>{selectedItem.platform}</span>
                      </div>
                    </div>
                  </div>
                  <SentimentBadge sentiment={selectedItem.sentiment} size="lg" />
                </div>

                <div className="bg-muted p-5 rounded-2xl border border-border relative">
                  <div className="absolute -top-3 left-6 text-2xl">💬</div>
                  <p className="text-foreground text-[15px] leading-relaxed pt-2">{selectedItem.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/60 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selectedItem.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col bg-muted/30 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Reply Workflow</h3>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {selectedItem.reply_status === 'PENDING' || selectedItem.reply_status === 'NEEDS_REPLY' ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground mb-2">Draft an AI Response</h4>
                    <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
                      Generate a contextual, brand-aligned response based on the user&apos;s sentiment and your configured guidelines.
                    </p>
                    <button
                      onClick={() => generateMutation.mutate(selectedItem.id)}
                      disabled={generateMutation.isPending}
                      className="group relative overflow-hidden bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 disabled:opacity-50"
                    >
                      <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <span className="flex items-center gap-2 relative z-10">
                        {generateMutation.isPending ? (
                          <><RefreshCcw className="w-4 h-4 animate-spin" /> Analyzing context...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> Generate Response</>
                        )}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className={cn(
                      "flex-1 bg-white border p-6 rounded-2xl flex flex-col mb-6 shadow-sm transition-all",
                      selectedItem.reply_status === 'REPLIED' ? "border-emerald-200 bg-emerald-50/30" : "border-indigo-100 shadow-indigo-100/50"
                    )}>
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <div className="flex items-center gap-2">
                          {selectedItem.reply_status === 'REPLIED' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                          )}
                          <span className={cn(
                            "font-bold text-sm",
                            selectedItem.reply_status === 'REPLIED' ? "text-emerald-800" : "text-indigo-900"
                          )}>
                            {selectedItem.reply_status === 'REPLIED' ? 'Published Reply' : (selectedItem.human_reply ? 'Refined Draft' : 'AI Suggested Draft')}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                          selectedItem.reply_status === 'REPLIED' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                        )}>
                          {selectedItem.reply_status}
                        </span>
                      </div>

                      {editMode ? (
                        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 w-full p-4 border-2 border-indigo-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 resize-none min-h-[150px] font-medium"
                            placeholder="Refine the response..."
                          />
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={() => setEditMode(false)}
                              className="px-4 py-2 text-muted-foreground font-semibold hover:text-slate-700 hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                              onClick={() => updateMutation.mutate({ id: selectedItem.id, reply: editValue })}
                              disabled={updateMutation.isPending}
                              className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {updateMutation.isPending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={cn(
                          "text-[15px] leading-relaxed flex-1 whitespace-pre-wrap font-medium",
                          selectedItem.reply_status === 'REPLIED' ? "text-emerald-900/80" : "text-indigo-950/80"
                        )}>
                          {selectedItem.human_reply || selectedItem.ai_generated_reply}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-3 justify-end shrink-0">
                      {['AI_DRAFTED', 'APPROVED'].includes(selectedItem.reply_status) && !editMode && (
                        <button
                          onClick={() => {
                            setEditValue(selectedItem.human_reply || selectedItem.ai_generated_reply);
                            setEditMode(true);
                          }}
                          className="px-6 py-2.5 text-slate-700 bg-white border border-border rounded-xl font-bold hover:bg-muted hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>
                      )}

                      {selectedItem.reply_status === 'AI_DRAFTED' && !editMode && (
                        <button
                          onClick={() => approveMutation.mutate(selectedItem.id)}
                          disabled={approveMutation.isPending}
                          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Draft
                        </button>
                      )}

                      {selectedItem.reply_status === 'APPROVED' && !editMode && (
                        <button
                          onClick={() => sendMutation.mutate(selectedItem.id)}
                          disabled={sendMutation.isPending}
                          className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 flex gap-2 items-center"
                        >
                          <Send className="w-4 h-4" /> Publish Reply
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-white text-slate-600 border border-border hover:border-slate-300 hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function SentimentBadge({ sentiment, size = 'sm' }: { sentiment: string, size?: 'sm' | 'lg' }) {
  const isPositive = sentiment === 'POSITIVE';
  const isNegative = sentiment === 'NEGATIVE';

  return (
    <span className={cn(
      "font-black uppercase tracking-wider flex items-center gap-1 shrink-0",
      size === 'sm' ? "text-[10px] px-2 py-0.5 rounded-full" : "text-xs px-3 py-1 rounded-lg",
      isPositive ? "bg-emerald-100 text-emerald-700" :
      isNegative ? "bg-rose-100 text-rose-700" :
      "bg-muted text-slate-600"
    )}>
      {isNegative && <AlertCircle className={size === 'sm' ? "w-3 h-3" : "w-4 h-4"} />}
      {sentiment}
    </span>
  );
}

function InboxSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-10 bg-slate-200 rounded w-48" />
      </div>
      <div className="flex flex-1 gap-6">
        <div className="w-1/3 bg-white rounded-xl border border-border p-4 space-y-4">
          <div className="h-10 bg-muted rounded-lg" />
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="w-2/3 bg-white rounded-xl border border-border" />
      </div>
    </div>
  );
}


