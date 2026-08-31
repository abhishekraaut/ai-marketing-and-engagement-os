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
  { id: 'X', name: 'X (Twitter)', icon: Hash, color: 'text-foreground', bg: 'bg-muted', border: 'border-border', desc: 'Real-time brand mentions and public discourse.' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: Camera, color: 'text-[#E1306C]', bg: 'bg-[#E1306C]/10', border: 'border-[#E1306C]/20', desc: 'Visual campaigns and influencer collaborations.' },
  { id: 'FACEBOOK', name: 'Facebook', icon: Users, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/20', desc: 'Community management and targeted ads.' },
  { id: 'YOUTUBE', name: 'YouTube', icon: MonitorPlay, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]/20', desc: 'Video content and long-form engagement.' },
];


declare global {
  interface Window {
    FB: {
      login: (callback: (response: { authResponse?: { accessToken: string } }) => void, options?: { scope: string }) => void;
    };
  }
}

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

  
  const connectMetaMutation = useMutation({
    mutationFn: (accessToken: string) => socialAccountsApi.connectMetaAccount(ORG_ID!, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', ORG_ID] });
      toast({ 
        title: 'Meta Accounts Connected', 
        description: "Successfully authenticated pages.",
        
 
        type: 'success' 
      });
      setConnectModalOpen(false);
      setAccountName('');
      setSelectedPlatform(null);
    }
  });

  const handleMetaLogin = () => {
    // Check if FB SDK is loaded
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.login(
        (response: { authResponse?: { accessToken: string } }) => {
          if (response.authResponse && response.authResponse.accessToken) {
            connectMetaMutation.mutate(response.authResponse.accessToken);
          } else {
            toast({ title: 'Auth Cancelled', description: 'User cancelled login or did not fully authorize.', type: 'error' });
          }
        },
        { scope: 'pages_manage_posts,pages_read_engagement,pages_messaging,pages_show_list,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_messages' }
      );
    } else {
      // Fallback to manually pasting a token
      if (accountName) {
        connectMetaMutation.mutate(accountName);
      } else {
        toast({ title: 'Token Required', description: 'Facebook SDK failed to load. Please paste a token to connect Meta accounts manually.', type: 'error' });
      }
    }
  };

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
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          System Settings
        </h1>
        <p className="page-description">Manage your organization preferences and social integrations.</p>
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
          
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted border border-transparent hover:border-border text-slate-600 font-medium transition-all text-left">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" /> Security & Privacy
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted border border-transparent hover:border-border text-slate-600 font-medium transition-all text-left">
            <LogOut className="w-5 h-5 text-muted-foreground" /> Organization Danger Zone
          </button>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-lg font-bold text-foreground">Connected Platforms</h2>
              <p className="text-sm text-muted-foreground mt-1">
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
                        ? "border-border bg-white" 
                        : "border-border bg-muted/50 hover:border-border hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", platform.bg, platform.color, platform.border)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{platform.name}</h3>
                        {isConnected ? (
                          <div className="flex items-center gap-1.5 mt-1 text-sm">
                            <span className="font-semibold text-slate-700">{account.account_name}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-0.5">{platform.desc}</p>
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
                          : "bg-white border-2 border-border text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
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
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
              </h2>
              <button onClick={() => setConnectModalOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                {selectedPlatform === 'FACEBOOK' || selectedPlatform === 'INSTAGRAM' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meta OAuth Short-Lived Token</label>
                    <input 
                      type="text" 
                      value={accountName} 
                      onChange={e => setAccountName(e.target.value)} 
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Paste EAAC... token here or click Authorize"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Clicking &quot;Authorize App&quot; will open the real Facebook Login SDK. If the SDK fails to load, paste your Graph API Explorer token above.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Name (Mock Authentication)</label>
                    <input 
                      type="text" 
                      value={accountName} 
                      onChange={e => setAccountName(e.target.value)} 
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. MyBrand Official"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
              <button onClick={() => setConnectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-foreground">
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (selectedPlatform === 'FACEBOOK' || selectedPlatform === 'INSTAGRAM') {
                    handleMetaLogin();
                  } else {
                    connectMutation.mutate(selectedPlatform);
                  }
                }}
                disabled={connectMutation.isPending || connectMetaMutation.isPending || (!accountName && selectedPlatform !== 'FACEBOOK' && selectedPlatform !== 'INSTAGRAM')}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {(connectMutation.isPending || connectMetaMutation.isPending) && <RefreshCcw className="w-4 h-4 animate-spin" />}
                {connectMutation.isPending || connectMetaMutation.isPending ? 'Connecting...' : 'Authorize App'}
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
        <div className="h-4 bg-muted rounded w-96" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-muted h-24" />
            <div className="p-6 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted border-2 border-border rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
