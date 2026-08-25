'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { SocialAccount,  socialAccountsApi } from '@/lib/api/client';
import { Settings, Briefcase, Camera, Users, Hash, CheckCircle2, Link2, LogOut, ArrowRight, ShieldCheck, RefreshCcw, MonitorPlay, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

const PLATFORMS = [
  { id: 'LINKEDIN', name: 'LinkedIn', icon: Briefcase, color: 'text-[#0077b5]', bg: 'bg-[#0077b5]/10', border: 'border-[#0077b5]/20', desc: 'Sync professional updates and B2B engagement.' },
  { id: 'X', name: 'X (Twitter)', icon: Hash, color: 'text-slate-900', bg: 'bg-slate-100', border: 'border-slate-200', desc: 'Real-time brand mentions and public discourse.' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: Camera, color: 'text-[#E1306C]', bg: 'bg-[#E1306C]/10', border: 'border-[#E1306C]/20', desc: 'Visual campaigns and influencer collaborations.' },
  { id: 'FACEBOOK', name: 'Facebook', icon: Users, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/20', desc: 'Community management and targeted ads.' },
  { id: 'YOUTUBE', name: 'YouTube', icon: MonitorPlay, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]/20', desc: 'Video content and long-form engagement.' },
];

export default function SettingsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts', ORG_ID],
    queryFn: () => socialAccountsApi.getAccounts(ORG_ID!),
    enabled: !!ORG_ID
  });

  const connectMutation = useMutation({
    mutationFn: (platform: string) => 
      socialAccountsApi.connectAccount(ORG_ID!, { 
        platform, 
        external_account_id: `mock_ext_${Date.now()}`,
        account_name: accountName || `${PLATFORMS.find(p => p.id === platform)?.name} Official`
      }),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', ORG_ID] });
      toast({ 
        title: 'Account Connected', 
        description: `Successfully authenticated with ${PLATFORMS.find(p => p.id === platform)?.name}.`, 
        type: 'success' 
      });
      setConnectModalOpen(false);
      setAccountName('');
      setSelectedPlatform(null);
    },
    onError: () => {
      toast({ title: 'Connection Failed', description: 'Failed to authenticate with platform.', type: 'error' });
    }
  });

  const handleConnectClick = (platformId: string) => {
    setSelectedPlatform(platformId);
    setAccountName('');
    setConnectModalOpen(true);
  };

  if (!ORG_ID) return <SettingsSkeleton />;

  const getAccountForPlatform = (platformId: string) => {
    return accounts?.find((acc: SocialAccount) => acc.platform === platformId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          System Settings
        </h1>
        <p className="text-slate-500 mt-1">Manage your organization preferences and social integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Nav */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold transition-all shadow-sm">
            <span className="flex items-center gap-3">
              <Link2 className="w-5 h-5" /> Social Accounts
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-600 font-medium transition-all text-left">
            <ShieldCheck className="w-5 h-5 text-slate-400" /> Security & Privacy
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-600 font-medium transition-all text-left">
            <LogOut className="w-5 h-5 text-slate-400" /> Organization Danger Zone
          </button>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Connected Platforms</h2>
              <p className="text-sm text-slate-500 mt-1">
                Link your social media accounts to enable AI monitoring, engagement tracking, and automated publishing.
              </p>
            </div>
            
            <div className="p-6 space-y-4 relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              )}
              
              {PLATFORMS.map(platform => {
                const account = getAccountForPlatform(platform.id);
                const isConnected = !!account;
                const Icon = platform.icon;

                return (
                  <div 
                    key={platform.id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-5 border-2 rounded-xl transition-all duration-200 group gap-4 sm:gap-0",
                      isConnected 
                        ? "border-slate-200 bg-white" 
                        : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", platform.bg, platform.color, platform.border)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{platform.name}</h3>
                        {isConnected ? (
                          <div className="flex items-center gap-1.5 mt-1 text-sm">
                            <span className="font-semibold text-slate-700">{account.account_name}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 mt-0.5">{platform.desc}</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleConnectClick(platform.id)}
                      disabled={isConnected}
                      className={cn(
                        "px-6 py-2.5 text-sm font-bold rounded-xl transition-all w-full sm:w-auto shrink-0 flex items-center justify-center gap-2",
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
                      )}
                    >
                      {isConnected ? (
                        <><CheckCircle2 className="w-4 h-4" /> Connected</>
                      ) : connectMutation.isPending && connectMutation.variables === platform.id ? (
                        <><RefreshCcw className="w-4 h-4 animate-spin" /> Authenticating...</>
                      ) : (
                        'Connect Account'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {connectModalOpen && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
              </h2>
              <button onClick={() => setConnectModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name (Mock Authentication)</label>
                <input 
                  type="text" 
                  value={accountName} 
                  onChange={e => setAccountName(e.target.value)} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. MyBrand Official"
                />
                <p className="text-xs text-slate-500 mt-2">
                  In a real scenario, this would redirect to the platform&apos;s OAuth flow.
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setConnectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                Cancel
              </button>
              <button 
                onClick={() => connectMutation.mutate(selectedPlatform)}
                disabled={connectMutation.isPending || !accountName}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {connectMutation.isPending && <RefreshCcw className="w-4 h-4 animate-spin" />}
                {connectMutation.isPending ? 'Connecting...' : 'Authorize App'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-96" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 h-24" />
            <div className="p-6 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 border-2 border-slate-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
