'use client';
import { useState } from 'react';
import { getSupabase } from '../../lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + '/portal', shouldCreateUser: false },
      });
      if (error) throw error;
      setMessage('If your account is authorized, check your email for the sign-in link.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#151d18] px-5 py-20 text-[#f8f4ea]">
    <div className="mx-auto max-w-md rounded-3xl border border-[#5f6b5d] bg-[#202a22] p-8">
      <p className="text-sm uppercase tracking-widest text-[#d3b982]">Justin&apos;s Operation</p>
      <h1 className="mt-5 text-3xl font-semibold">Client portal sign-in</h1>
      <p className="mt-3 text-sm text-[#c8d0c7]">Only invited restaurant owners and authorized staff can use the portal. Your account must be provisioned by Justin.</p>
      <form onSubmit={sendLink} className="mt-8 space-y-4">
        <label className="block text-sm" htmlFor="email">Account email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254}
          className="w-full rounded-lg border border-[#788776] bg-[#111914] px-4 py-3 text-white" autoComplete="email" />
        <button type="submit" disabled={busy} className="w-full rounded-full bg-[#d3b982] px-5 py-3 font-semibold text-[#172016] disabled:opacity-50">
          {busy ? 'Sending…' : 'Send secure sign-in link'}
        </button>
      </form>
      {message && <p role="status" className="mt-5 text-sm text-[#d3b982]">{message}</p>}
      <a href="/" className="mt-7 inline-block text-sm underline">Return to homepage</a>
    </div>
  </main>;
}
