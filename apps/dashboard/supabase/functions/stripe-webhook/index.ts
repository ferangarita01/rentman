// @ts-nocheck
/*
  Deno Edge Function - Type Definitions for IDE (Rentman)
  This file is an edge function running on Deno. Imports from URLs are valid.
*/
declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
    }
    export const env: Env;
}

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Initialize Stripe with strict signature verification
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// @ts-ignore
serve(async (req: any) => {
    const signature = req.headers.get('Stripe-Signature')

    // 1. Signature Verification (CRITICAL SECURITY STEP)
    try {
        const body = await req.text()

        // Verify signature using the WEBHOOK SECRET, not the API Key
        // @ts-ignore
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
            undefined,
            cryptoProvider
        )

        // 2. Store Event for Async Processing (Queue Pattern)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check idempotency (avoid duplicate processing if Stripe retries)
        const { data: existing } = await supabase
            .from('stripe_events')
            .select('id')
            .eq('event_id', event.id)
            .single()

        if (existing) {
            console.log(`Event ${event.id} already received. Skipping.`)
            return new Response(JSON.stringify({ received: true }), { status: 200 })
        }

        // Insert into Queue
        const { error } = await supabase
            .from('stripe_events')
            .insert({
                event_id: event.id,
                event_type: event.type,
                event_data: event,
                status: 'pending', // Worker will pick this up
            })

        if (error) {
            console.error('Database Error:', error)
            return new Response('Database Error', { status: 500 })
        }

        // 3. Trigger Async Worker (Optional optimization)
        // We can fire-and-forget call the worker, or rely on Cron/Trigger
        // For now, let's rely on Cron (robustness) or immediate invocation

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown Error'
        console.error(`Webhook Error: ${errorMessage}`)
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
    }
})
