import { NextRequest,NextResponse } from 'next/server';
import { portalDb } from '../../../lib/supabase/server';
export async function GET(request:NextRequest){
 const url=new URL(request.url), code=url.searchParams.get('code');
 if(!code) return NextResponse.redirect(new URL('/login?error=invalid_link',url.origin));
 const db=await portalDb();const {error}=await db.auth.exchangeCodeForSession(code);
 return NextResponse.redirect(new URL(error?'/login?error=sign_in_failed':'/portal',url.origin));
}