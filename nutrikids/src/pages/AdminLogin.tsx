/* eslint-disable react-refresh/only-export-components -- admin token helpers are intentionally colocated with the login page */
import { useState } from 'react';
import type { FormEvent } from 'react';

const ADMIN_TOKEN_KEY = 'nutrikids_admin_token';

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登录失败，请重试。');
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试。');
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <form onSubmit={submit} autoComplete="on" className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <div className="mb-8"><p className="text-sm font-semibold text-violet-600">NUTRIKIDS</p><h1 className="mt-2 text-3xl font-bold text-slate-900">管理端登录</h1><p className="mt-2 text-sm text-slate-500">仅限本地管理员账号访问。</p></div>
      <label className="block text-sm font-medium text-slate-700">账号<input value={email} onChange={(e) => setEmail(e.target.value)} name="username" autoComplete="username" type="email" placeholder="请输入管理员邮箱" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" required /></label>
      <label className="mt-5 block text-sm font-medium text-slate-700">密码<input value={password} onChange={(e) => setPassword(e.target.value)} name="password" autoComplete="current-password" type="password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" required /></label>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{loading ? '登录中…' : '登录管理端'}</button>
    </form>
  </main>;
}
