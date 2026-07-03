'use client';
import { useEffect, useState } from 'react';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  totpConfigured: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; vertical: string } | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [inviteRole, setInviteRole] = useState<'campaign_manager' | 'viewer'>('campaign_manager');
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setLoading(false);
    });
    fetch('/api/settings/team').then(r => r.json()).then(d => {
      if (d.team) setTeam(d.team);
    }).catch(() => {});
  }, []);

  async function handleInvite() {
    const res = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: inviteRole }),
    });
    const data = await res.json();
    if (data.inviteUrl) {
      setInviteUrl(window.location.origin + data.inviteUrl);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Brand profile, team management, and configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Brand Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Display Name</label>
            <input type="text" defaultValue={profile?.name} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Industry Vertical</label>
            <input type="text" defaultValue={profile?.vertical} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Website</label>
            <input type="url" placeholder="https://" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Logo URL</label>
            <input type="url" placeholder="https://" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Team Management</h2>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">Invite Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'campaign_manager' | 'viewer')}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm">
                <option value="campaign_manager">Campaign Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button onClick={handleInvite}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Generate Invite Link
            </button>
          </div>

          {inviteUrl && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-700 mb-1">Share this link (expires in 24h, single use):</p>
              <p className="font-mono text-xs text-emerald-900 break-all select-all">{inviteUrl}</p>
            </div>
          )}

          {team.length > 0 && (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">TOTP</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.id} className="border-b border-zinc-50">
                    <td className="py-2">{m.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.role === 'admin' ? 'bg-purple-100 text-purple-700' : m.role === 'campaign_manager' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {m.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2">{m.totpConfigured ? '✓' : '—'}</td>
                    <td className="py-2 text-zinc-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Wallet Configuration</h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Base Wallet Address</label>
          <input type="text" placeholder="0x..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-mono" />
          <p className="text-xs text-zinc-400 mt-1">Used for escrow interactions in production</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-500">API Keys</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-200 text-zinc-500">Coming Soon</span>
          </div>
          <p className="text-xs text-zinc-400">Programmatic Listing management with scoped API keys, rate limiting, and rotation.</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Notifications</h2>
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm text-zinc-700">In-app alerts</span>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </label>
            <label className="flex items-center justify-between opacity-50">
              <span className="text-sm text-zinc-500">Email notifications</span>
              <span className="text-[10px] text-zinc-400">Coming Soon</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
