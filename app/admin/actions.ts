'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { portalDb } from '../../lib/supabase/server';
export async function updateRequestStatus(form: FormData) {
 const db = await portalDb();
 const { data: { user } } = await db.auth.getUser();
 if (!user) redirect('/login');
 const { data: staff } = await db.from('portal_staff').select('role').eq('user_id', user.id).maybeSingle();
 if (!staff) throw new Error('Staff access required');
 const id = String(form.get('id') || '');
 const status = String(form.get('status') || '');
 const allowed = ['open', 'in_review', 'awaiting_approval', 'resolved', 'closed'];
 if (!/^[0-9a-f-]{36}$/i.test(id) || !allowed.includes(status)) throw new Error('Invalid change');
 const { error } = await db.from('service_requests').update({status, updated_at:new Date().toISOString()}).eq('id',id);
 if (error) throw new Error('Request status could not be saved');
 revalidatePath('/admin');
 redirect('/admin?updated=1');
}
