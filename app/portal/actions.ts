'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {portalDb} from '../../lib/supabase/server';
export async function submitRequest(form:FormData){
 const db=await portalDb();const {data:{user}}=await db.auth.getUser();if(!user) redirect('/login');
 const restaurant_id=String(form.get('restaurant_id')||'');
 const request_type=String(form.get('request_type')||'');
 const subject=String(form.get('subject')||'').trim();
 const details=String(form.get('details')||'').trim();
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(restaurant_id)||!['menu','hours','photos','promotion','technical','other'].includes(request_type)||subject.length<1||subject.length>160||details.length<1||details.length>8000) throw new Error('Please provide valid request details');
 const {error}=await db.from('service_requests').insert({restaurant_id,created_by:user.id,request_type,subject,details,status:'open'});
 if(error) throw new Error('Could not submit this request. Confirm you have owner/manager access.');
 revalidatePath('/portal');redirect('/portal?submitted=1');
}