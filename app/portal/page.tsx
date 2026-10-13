import {redirect} from 'next/navigation';
import {portalDb} from '../../lib/supabase/server';
import {submitRequest} from './actions';
import {logOut} from '../login/actions';
type Props={searchParams:Promise<{restaurant?:string,submitted?:string}>};
export default async function Portal({searchParams}:Props){
 const db=await portalDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user) redirect('/login');
 const {data:members,error:memberError}=await db.from('restaurant_memberships').select('restaurant_id,role,restaurants(id,name,website_url)').eq('user_id',user.id);
 if(memberError) throw new Error('Unable to load restaurant membership');
 type Member={restaurant_id:string,role:string,restaurants:{id:string,name:string,website_url:string|null}|{id:string,name:string,website_url:string|null}[]|null};
 const accounts=(members||[]).map((m)=>{const v=m as unknown as Member;const restaurant=Array.isArray(v.restaurants)?v.restaurants[0]:v.restaurants;return {id:v.restaurant_id,role:v.role,name:restaurant?.name||'Restaurant',website:restaurant?.website_url||null}});
 const params=await searchParams;
 const selected=accounts.find(a=>a.id===params.restaurant)||accounts[0];
 const shell='min-h-screen bg-[#101714] text-[#f7f2e7] p-5 sm:p-10', panel='rounded-2xl border border-[#bda273]/25 p-5 sm:p-7 bg-white/[.04]';
 if(!selected) return <main className={shell}><h1 className="text-3xl font-serif">Account pending</h1><p className="my-5">No restaurant is assigned to your login yet. Contact Justin's Operation for an invitation.</p><form action={logOut}><button className="underline">Sign out</button></form></main>;
 const [{data:reports,error:reportsError},{data:requests,error:requestsError}]=await Promise.all([
 db.from('monthly_reports').select('id,period_start,period_end,summary,visitors,call_clicks,direction_clicks,order_link_clicks,source_name').eq('restaurant_id',selected.id).eq('status','published').order('period_start',{ascending:false}).limit(12),
 db.from('service_requests').select('id,request_type,subject,status,created_at').eq('restaurant_id',selected.id).order('created_at',{ascending:false}).limit(30)
 ]);
 if(reportsError||requestsError) throw new Error('Unable to load client portal data');
 const latest=reports?.[0];
 return <main className={shell}><div className="mx-auto max-w-6xl space-y-8">
 <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6"><div><p className="text-[#c6a975] text-xs uppercase tracking-widest">Justin's Operation</p><h1 className="font-serif text-3xl mt-2">{selected.name}</h1><p className="text-sm text-[#c7cec5]">Restaurant client portal · {selected.role}</p></div><form action={logOut}><button className="rounded-full border border-white/30 px-5 py-2">Sign out</button></form></header>
 {accounts.length>1&&<nav aria-label="Restaurants" className="flex flex-wrap gap-3">{accounts.map(a=><a className={'rounded-full border px-4 py-2 '+(a.id===selected.id?'border-[#c6a975]':'border-white/20')} key={a.id} href={'/portal?restaurant='+encodeURIComponent(a.id)}>{a.name}</a>)}</nav>}
 {params.submitted==='1'&&<p role="status" className="rounded-lg border border-green-600 p-3">Your service request was saved.</p>}
 <section className={panel}><h2 className="font-serif text-2xl mb-4">Monthly performance</h2>{latest?<><p className="text-sm text-[#c7cec5] mb-4">{latest.period_start} through {latest.period_end}</p><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Visitors',latest.visitors],['Call clicks',latest.call_clicks],['Directions clicks',latest.direction_clicks],['Ordering-link clicks',latest.order_link_clicks]].map(([name,value])=><div key={String(name)} className="p-4 rounded-xl bg-black/25"><p className="text-sm text-[#c7cec5]">{name}</p><strong className="text-2xl">{value??'—'}</strong></div>)}</div><p className="mt-4 whitespace-pre-wrap">{latest.summary}</p>{latest.source_name&&<p className="text-xs mt-2 text-[#c7cec5]">Source: {latest.source_name}</p>}</>:<p className="text-[#c7cec5]">No verified analytics reports have been published for this restaurant yet.</p>}<p className="text-xs mt-4 text-[#c7cec5]">Clicks indicate website interactions, not confirmed orders or revenue.</p></section>
 <section className={panel}><h2 className="font-serif text-2xl">Request a website update</h2><p className="text-[#c7cec5] mt-2 mb-5">Submit a menu, hours, photo or promotion request. Changes are not published automatically.</p>{selected.role==='viewer'?<p>Only owners and managers can submit requests.</p>:<form action={submitRequest} className="grid gap-4 max-w-2xl"><input type="hidden" name="restaurant_id" value={selected.id}/><label className="grid gap-2">Request type<select required name="request_type" className="rounded-lg bg-[#17221c] border border-white/30 p-3"><option value="menu">Menu / price</option><option value="hours">Business hours</option><option value="photos">Photos</option><option value="promotion">Promotion</option><option value="technical">Technical issue</option><option value="other">Other</option></select></label><label className="grid gap-2">Subject<input required maxLength={160} name="subject" className="rounded-lg bg-[#17221c] border border-white/30 p-3"/></label><label className="grid gap-2">Details<textarea required maxLength={8000} name="details" rows={5} className="rounded-lg bg-[#17221c] border border-white/30 p-3"/></label><button className="rounded-full bg-[#c6a975] text-[#101714] font-semibold p-3">Submit request</button></form>}</section>
 <section className={panel}><h2 className="font-serif text-2xl mb-4">Service request history</h2>{requests?.length?<ul className="space-y-3">{requests.map(r=><li key={r.id} className="border-b border-white/10 pb-3"><strong>{r.subject}</strong><p className="text-sm text-[#c7cec5]">{r.request_type} · {r.status} · {new Date(r.created_at).toLocaleDateString('en-US')}</p></li>)}</ul>:<p className="text-[#c7cec5]">No requests yet.</p>}</section>
 {selected.website&&<a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-block underline text-[#c6a975]">View your restaurant website ↗</a>}
 </div></main>;
}