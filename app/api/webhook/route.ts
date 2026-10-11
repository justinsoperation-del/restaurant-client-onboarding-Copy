import {NextResponse} from 'next/server';
// Placeholder, not a functional Stripe webhook. Never acknowledge as processed.
export async function POST(){return NextResponse.json({error:'Webhook integration not activated'},{status:503});}
