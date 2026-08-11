'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { engagementApi } from '@/lib/api/client';


export default function InboxPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Compute query params based on active filter
  const getParams = () => {
    let params: any = {};
    if (activeFilter === 'NEEDS_REPLY') params.reply_status = 'NEEDS_REPLY';
    if (activeFilter === 'POSITIVE') params.sentiment = 'POSITIVE';
    if (activeFilter === 'NEGATIVE') params.sentiment = 'NEGATIVE';
    if (platformFilter !== 'ALL') params.platform = platformFilter;
    return params;
  };

  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['engagements', ORG_ID, getParams()],
    queryFn: () => engagementApi.getEngagements(ORG_ID, getParams()),
  });

  const syncMutation = useMutation({
    mutationFn: () => engagementApi.syncEngagement(ORG_ID),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] })
  });

  const generateMutation = useMutation({
    mutationFn: (id: number) => engagementApi.generateReply(ORG_ID, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number, reply: string }) => engagementApi.updateReply(ORG_ID, id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      setEditMode(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => engagementApi.approveReply(ORG_ID, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] })
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => engagementApi.sendReply(ORG_ID, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagements'] })
  });

  const selectedItem = engagements.find((e: any) => e.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engagement Inbox</h1>
          <p className="text-slate-500">Manage incoming comments and messages across all platforms.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border-slate-300 rounded-md text-sm"
          >
            <option value="ALL">All Platforms</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="X">X (Twitter)</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
          <button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Inbox'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Pane - List */}
        <div className="w-1/3 flex flex-col bg-white rounded-lg shadow border border-slate-200">
          <div className="flex border-b border-slate-200 overflow-x-auto p-2 gap-2">
            <FilterBtn label="All" active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
            <FilterBtn label="Needs Reply" active={activeFilter === 'NEEDS_REPLY'} onClick={() => setActiveFilter('NEEDS_REPLY')} />
            <FilterBtn label="Positive" active={activeFilter === 'POSITIVE'} onClick={() => setActiveFilter('POSITIVE')} />
            <FilterBtn label="Negative" active={activeFilter === 'NEGATIVE'} onClick={() => setActiveFilter('NEGATIVE')} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="p-4 text-center text-slate-500">Loading engagements...</div>
            ) : engagements.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No items found. Try syncing or changing filters.
              </div>
            ) : (
              engagements.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 rounded-lg cursor-pointer border ${selectedId === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-900 text-sm">{item.author_name}</span>
                    <span className="text-xs text-slate-500">{item.platform}</span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{item.content}</p>
                  <div className="flex gap-2 mt-2">
                    <SentimentBadge sentiment={item.sentiment} />
                    {item.reply_status === 'REPLIED' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">REPLIED</span>}
                    {item.reply_status === 'APPROVED' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">APPROVED</span>}
                    {item.reply_status === 'AI_DRAFTED' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">AI DRAFT</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Detail */}
        <div className="w-2/3 bg-white rounded-lg shadow border border-slate-200 flex flex-col">
          {!selectedItem ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select an engagement to view details
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedItem.author_name}</h2>
                    <p className="text-slate-500 text-sm">{selectedItem.author_handle} on {selectedItem.platform}</p>
                  </div>
                  <SentimentBadge sentiment={selectedItem.sentiment} />
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-800">{selectedItem.content}</p>
                  <p className="text-xs text-slate-400 mt-2">Received: {new Date(selectedItem.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Reply Workflow</h3>
                
                {selectedItem.reply_status === 'PENDING' ? (
                  <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-600 mb-4">No reply generated yet.</p>
                    <button 
                      onClick={() => generateMutation.mutate(selectedItem.id)}
                      disabled={generateMutation.isPending}
                      className="bg-purple-600 text-white px-6 py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {generateMutation.isPending ? 'Generating...' : '✨ Generate AI Reply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg flex flex-col mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-indigo-800 font-semibold text-sm">
                          {selectedItem.reply_status === 'REPLIED' ? 'Sent Reply' : (selectedItem.human_reply ? 'Edited Reply' : '✨ AI Suggested Reply')}
                        </span>
                        <span className="text-xs text-indigo-500 font-medium">{selectedItem.reply_status}</span>
                      </div>
                      
                      {editMode ? (
                        <div className="flex-1 flex flex-col">
                          <textarea 
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 w-full p-2 border border-indigo-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setEditMode(false)} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                            <button 
                              onClick={() => updateMutation.mutate({ id: selectedItem.id, reply: editValue })}
                              className="bg-indigo-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-indigo-700"
                            >Save</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 flex-1 whitespace-pre-wrap">
                          {selectedItem.human_reply || selectedItem.ai_generated_reply}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
                      {['AI_DRAFTED', 'APPROVED'].includes(selectedItem.reply_status) && !editMode && (
                        <button 
                          onClick={() => {
                            setEditValue(selectedItem.human_reply || selectedItem.ai_generated_reply);
                            setEditMode(true);
                          }}
                          className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded font-medium hover:bg-slate-50"
                        >Edit</button>
                      )}
                      
                      {selectedItem.reply_status === 'AI_DRAFTED' && (
                        <button 
                          onClick={() => approveMutation.mutate(selectedItem.id)}
                          disabled={approveMutation.isPending}
                          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                        >Approve</button>
                      )}
                      
                      {selectedItem.reply_status === 'APPROVED' && (
                        <button 
                          onClick={() => sendMutation.mutate(selectedItem.id)}
                          disabled={sendMutation.isPending}
                          className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 flex gap-2 items-center"
                        >
                          Send Reply 🚀
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
      className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border ${active ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  let color = 'bg-slate-100 text-slate-700';
  if (sentiment === 'POSITIVE') color = 'bg-green-100 text-green-700';
  if (sentiment === 'NEGATIVE') color = 'bg-red-100 text-red-700';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color} uppercase tracking-wider`}>
      {sentiment}
    </span>
  );
}
