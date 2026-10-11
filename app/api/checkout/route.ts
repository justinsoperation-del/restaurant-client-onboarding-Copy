import {NextRequest,NextResponse} from 'next/server';
// Payment is intentionally blocked until legal terms, persistence and real Stripe setup are ready.
export async function POST(_request:NextRequest){return NextResponse.json({error:'Checkout is not activated. Finalize the service agreement, implement persistent server-side agreement acceptance, and verify Stripe test payments/webhooks first.'},{status:503});}
