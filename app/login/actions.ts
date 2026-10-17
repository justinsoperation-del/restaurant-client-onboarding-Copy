'use server';
import { redirect } from 'next/navigation';
import { portalDb } from '../../lib/supabase/server';
export async function sendLoginLink(form:FormData){
 const email=String(form.get('email')||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) redirect('/login?error=invalid_email');
 const db=await portalDb();
 const origin=process.env.NEXT_PUBLIC_SITE_URL;
 if(!origin || !/^https:\/\/[^\s/]+\/?$/.test(origin)) redirect('/login?error=site_configuration');
 const {error}=await db.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:origin+'/auth/callback'}});
 if(error){
   if(error.status===429 || error.code==='over_email_send_rate_limit') redirect('/login?error=email_limit');
   redirect('/login?error=email_failed');
 }
 redirect('/login?sent=1');
}
export async function logOut(){
 const db=await portalDb();await db.auth.signOut();redirect('/login');
}