import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function portalDb() {
 const store = await cookies();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) throw new Error('Portal not configured: Supabase environment variables missing');
 return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll(items: {name:string;value:string;options?:Record<string,any>}[]){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server components may not set cookies */}}}});
}