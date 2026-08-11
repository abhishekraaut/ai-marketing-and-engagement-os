'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { socialAccountsApi } from '@/lib/api/client';


const PLATFORMS = [
  { id: 'LINKEDIN', name: 'LinkedIn' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'X', name: 'X (Twitter)' },
];

export default function SettingsPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts', ORG_ID],
    queryFn: () => socialAccountsApi.getAccounts(ORG_ID),
  });

  const connectMutation = useMutation({
    mutationFn: (platform: string) => 
      socialAccountsApi.connectAccount(ORG_ID, { 
        platform, 
        external_account_id: `mock_ext_${Date.now()}`,
        account_name: `Mock ${platform} Account`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', ORG_ID] });
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading settings...</div>;
  }

  const getAccountForPlatform = (platformId: string) => {
    return accounts?.find((acc: any) => acc.platform === platformId);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your organization and social connections.</p>
      </div>

      <section className="bg-white p-6 rounded shadow border border-slate-200">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Social Accounts</h2>
        <div className="space-y-4">
          {PLATFORMS.map(platform => {
            const account = getAccountForPlatform(platform.id);
            const isConnected = !!account;

            return (
              <div key={platform.id} className="flex items-center justify-between p-4 border rounded bg-slate-50">
                <div>
                  <h3 className="font-medium text-slate-900">{platform.name}</h3>
                  <p className="text-sm text-slate-500">
                    {isConnected 
                      ? `Connected as ${account.account_name} (${account.status})` 
                      : 'Not connected'}
                  </p>
                </div>
                <button
                  onClick={() => connectMutation.mutate(platform.id)}
                  disabled={isConnected || connectMutation.isPending}
                  className={`px-4 py-2 text-sm font-medium rounded transition ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-700 cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isConnected ? 'Connected' : (connectMutation.isPending ? 'Connecting...' : 'Connect')}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
