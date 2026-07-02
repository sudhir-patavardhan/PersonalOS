'use client';
import { useEffect, useState } from 'react';
import type { Operator } from '@/lib/types';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/operators').then(r => r.json()).then(d => {
      setOperators(d.operators || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Operators</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage operator accounts</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">TOTP</th>
              <th className="pb-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {operators.map(op => (
              <tr key={op.id} className="border-b border-zinc-50">
                <td className="py-3 font-medium">{op.email}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${op.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {op.role}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`text-xs ${op.totpConfigured ? 'text-green-600' : 'text-red-600'}`}>
                    {op.totpConfigured ? 'Configured' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 text-zinc-600">{new Date(op.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
        <p className="text-sm text-zinc-600">Invite flow will be available in a future update. Currently, operators are created during first-run setup.</p>
      </div>
    </div>
  );
}
