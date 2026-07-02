'use client';
import { useEffect, useState } from 'react';
import type { AuditEntry } from '@/lib/types';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit').then(r => r.json()).then(d => {
      setEntries(d.entries || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-1">All operator actions are logged here</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">No audit entries yet. Actions will appear here after operators interact with the console.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Operator</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-zinc-50">
                  <td className="py-2 text-xs text-zinc-600">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="py-2 font-medium">{entry.operatorEmail}</td>
                  <td className="py-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono">{entry.action}</span>
                  </td>
                  <td className="py-2 text-zinc-600">{entry.target || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
