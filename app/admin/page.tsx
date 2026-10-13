import {redirect} from 'next/navigation';
import {portalDb} from '../../lib/supabase/server';
import {updateRequestStatus} from './actions';
import Link from 'next/link';
export const dynamic='force-dynamic';
const statuses=['open','in_review','awaiting_approval','resolved','closed'];
export default async function Admin({searchParams}:{searchParams:Promise<{status?:string,updated?:string}>}){
 const db=await portalDb();
 const {data:{user}}=await db.auth.getUser();if(!user) redirect('/login');
 const {data:staff,error:staffError}=await db.from('portal_staff').select('role').eq('user_id',user.id).maybeSingle();
 if(staffError||!staff) return <main className="min-h-screen bg-[#101714] text-[#f7f2e7] p-8"><h1 className="text-3xl font-serif">Access restricted</h1><p className="my-5">Only authorized Justin's Operation staff can access this area.</p><Link className="underline" href="/portal">Back to client portal</Link></main>;
 const p=await searchParams;
 const selected=statuses.includes(p.status||'')?p.status||'':'';
 let query=db.from('service_requests').select('id,restaurant_id,subject,details,request_type,status,created_at,restaurants(name)').order('created_at',{ascending:false}).limit(100);
 if(selected)query=query.eq('status',selected);
 const {data:requests,error}=await query;
 if(error) throw new Error('Unable to load service request queue');
 type Request={id:string;restaurant_id:string;subject:string;details:string;request_type:string;status:string;created_at:string;restaurants:{name:string}|{name:string}[]|null};
 const records=(requests||[]) as unknown as Request[];
 return <main className="min-h-screen bg-[#101714] text-[#f7f2e7] p-5 sm:p-10"><div className="max-w-6xl mx-auto space-y-7">
 <header className="flex justify-between gap-4 items-center flex-wrap border-b border-white/15 pb-5"><div><p className="text-[#c6a975] uppercase tracking-wider text-xs">Justin's Operation · Staff only</p><h1 className="text-4xl font-serif mt-2">Service request queue</h1><p className="text-[#c7cec5] mt-2">Review submitted requests and set their status. This does not publish website changes.</p></div><Link href="/portal" className="underline">Client portal</Link></header>
 {p.updated==='1'&&<p role="status" className="border border-green-700 rounded-lg p-3">Request status saved.</p>}
 <nav aria-label="Filter requests" className="flex flex-wrap gap-2">{[['','All'],['open','Open'],['in_review','In review'],['awaiting_approval','Awaiting approval'],['resolved','Resolved'],['closed','Closed']].map(([value,label])=><Link key={value} className={'rounded-full px-3 py-2 border '+(selected===value?'border-[#c6a975] bg-white/10':'border-white/20')} href={value?'/admin?status='+value:'/admin'}>{label}</Link>)}</nav>
 <p className="text-sm text-[#c7cec5]">Showing {records.length} most recent matching requests (maximum 100)</p>
 {records.length===0?<div className="border border-white/20 rounded-2xl p-8">No requests found.</div>:<div className="grid gap-4">{records.map(r=>{const restaurant=Array.isArray(r.restaurants)?r.restaurants[0]:r.restaurants;return <article key={r.id} className="rounded-2xl bg-white/[.04] border border-[#bda273]/25 p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-[#c6a975] text-sm">{restaurant?.name||'Restaurant'} · {r.request_type}</p><h2 className="text-xl font-semibold mt-2">{r.subject}</h2></div><span className="text-sm border border-white/20 rounded-full px-3 py-1 h-fit">{r.status.replaceAll('_',' ')}</span></div><p className="mt-4 whitespace-pre-wrap break-words">{r.details}</p><p className="text-xs text-[#c7cec5] mt-3">Submitted {new Date(r.created_at).toLocaleString('en-US')}</p><form action={updateRequestStatus} className="flex flex-wrap items-end gap-3 mt-5"><input type="hidden" name="id" value={r.id}/><label className="grid gap-2 text-sm">Status<select name="status" defaultValue={r.status} className="p-2 rounded-lg bg-[#17221c] border border-white/30">{statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label><button className="bg-[#c6a975] text-[#101714] rounded-full px-5 py-2 font-semibold">Save status</button></form></article>})}</div>}
 </div></main>;
}