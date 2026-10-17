'use client';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase-browser';

type Restaurant = { id: string; name: string; website_url: string | null };
type Membership = { restaurant_id: string; role: string; restaurants: Restaurant | Restaurant[] | null };
type ServiceRequest = { id: string; restaurant_id: string; request_type: string; subject: string; status: string; created_at: string };
const categories = ['menu','hours','photos','promotion','technical','other'] as const;

export default function Portal() {
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState('');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [type, setType] = useState<(typeof categories)[number]>('menu');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async (restaurantId: string) => {
    const db = getSupabase();
    const { data, error } = await db.from('service_requests')
      .select('id, restaurant_id, request_type, subject, status, created_at')
      .eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    setRequests((data || []) as ServiceRequest[]);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const db = getSupabase();
        const { data: { user: signedIn }, error: userError } = await db.auth.getUser();
        if (userError) throw userError;
        if (!active) return;
        setUser(signedIn);
        if (!signedIn) return;
        // Memberships are server-provisioned. RLS must enforce account-to-tenant isolation.
        const { data, error } = await db.from('restaurant_memberships')
          .select('restaurant_id, role, restaurants(id,name,website_url)')
          .eq('user_id', signedIn.id);
        if (error) throw error;
        const list = ((data || []) as Membership[]).flatMap(row =>
          row.restaurants ? (Array.isArray(row.restaurants) ? row.restaurants : [row.restaurants]) : []);
        if (!active) return;
        setRestaurants(list);
        if (list[0]) setSelected(list[0].id);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load portal.');
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    let unsubscribe: (() => void) | undefined;
    try {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') window.location.assign('/login');
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch { /* Configuration error is surfaced by initialize(). */ }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    loadRequests(selected).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [selected, loadRequests]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !user) return;
    setSubmitting(true); setMessage('');
    try {
      const db = getSupabase();
      const { error } = await db.from('service_requests').insert({
        restaurant_id: selected, created_by: user.id, request_type: type,
        subject: subject.trim(), details: details.trim(),
      });
      if (error) throw error;
      setSubject(''); setDetails('');
      await loadRequests(selected);
      setMessage('Request submitted. Justin will review it before any website change is published.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit request.');
    } finally { setSubmitting(false); }
  }

  const selectedRestaurant = restaurants.find(r => r.id === selected);
  return <main className="min-h-screen bg-[#151d18] px-5 py-12 text-[#f8f4ea]"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-6">
      <div><p className="text-xs uppercase tracking-widest text-[#d3b982]">Justin&apos;s Operation</p><h1 className="mt-2 text-3xl font-semibold">Restaurant client portal</h1></div>
      {user && <button onClick={async () => { await getSupabase().auth.signOut(); window.location.assign('/login'); }} className="rounded-full border border-white/30 px-5 py-2 text-sm">Sign out</button>}
    </header>
    {loading ? <p className="mt-10">Loading your account…</p> : !user ? <p className="mt-10">Please <a className="underline text-[#d3b982]" href="/login">sign in</a> to continue.</p> :
      restaurants.length === 0 ? <p className="mt-10">Your account has no assigned restaurants yet. Contact Justin to request access.</p> :
      <div className="mt-9 space-y-8">
        <section className="rounded-2xl border border-white/20 p-6">
          <label className="block text-sm" htmlFor="restaurant">Your restaurant</label>
          <select id="restaurant" value={selected} onChange={e=>setSelected(e.target.value)} className="mt-3 w-full rounded-lg bg-[#29382c] p-3">
            {restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {selectedRestaurant?.website_url && <a href={selectedRestaurant.website_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[#d3b982] underline">View restaurant website</a>}
        </section>
        <section className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-2xl font-semibold">Request a website change</h2>
          <p className="mt-2 text-sm text-[#c8d0c7]">Requests are reviewed before publication. Submitting does not change the live website.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm" htmlFor="type">Request category</label>
            <select id="type" value={type} onChange={e=>setType(e.target.value as typeof type)} className="w-full rounded-lg bg-[#29382c] p-3">
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <label className="block text-sm" htmlFor="subject">Subject</label>
            <input id="subject" value={subject} onChange={e=>setSubject(e.target.value)} required minLength={1} maxLength={160} className="w-full rounded-lg bg-[#29382c] p-3" />
            <label className="block text-sm" htmlFor="details">Requested change</label>
            <textarea id="details" value={details} onChange={e=>setDetails(e.target.value)} required minLength={1} maxLength={8000} rows={5} className="w-full rounded-lg bg-[#29382c] p-3"/>
            <button disabled={submitting} className="rounded-full bg-[#d3b982] px-7 py-3 font-semibold text-[#172016] disabled:opacity-50">{submitting?'Submitting…':'Submit request'}</button>
          </form>
        </section>
        <section className="rounded-2xl border border-white/20 p-6"><h2 className="text-2xl font-semibold">Recent requests</h2>
          <div className="mt-5 space-y-3">{requests.length ? requests.map(r=><div key={r.id} className="rounded-lg bg-white/5 p-4">
            <div className="flex flex-wrap justify-between gap-3"><strong>{r.subject}</strong><span className="text-sm text-[#d3b982]">{r.status.replaceAll('_',' ')}</span></div>
            <p className="mt-2 text-xs text-[#c8d0c7]">{r.request_type} · {new Date(r.created_at).toLocaleDateString()}</p>
          </div>) : <p className="text-sm text-[#c8d0c7]">No requests yet.</p>}</div>
        </section>
      </div>
    }
    {message && <p role="status" className="mt-6 text-sm text-[#d3b982]">{message}</p>}
  </div></main>;
}
