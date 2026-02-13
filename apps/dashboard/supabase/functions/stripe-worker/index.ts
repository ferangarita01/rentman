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

// Sync Engine Worker
// Processes 'pending' events from stripe_events table

// @ts-ignore
serve(async (req: any) => {
    try {
        // 1. Setup Supabase Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Fetch Pending Events (Batch of 10)
        // Using atomic update to lock rows would be better, but simple select for now
        const { data: events, error: fetchError } = await supabase
            .from('stripe_events')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(10)

        if (fetchError) throw fetchError

        if (!events || events.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending events' }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        console.log(`Processing ${events.length} events...`)
        const results = []

        // 3. Process Each Event
        for (const record of events) {
            const event = record.event_data
            let processingStatus = 'processed'
            let errorMessage = null

            try {
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        // @ts-ignore
                        await handlePaymentSucceeded(supabase, event.data.object)
                        break

                    case 'transfer.created':
                        // @ts-ignore
                        await handleTransferCreated(supabase, event.data.object)
                        break

                    // Add more handlers here

                    default:
                        console.log(`Unhandled event type: ${event.type}`)
                }
            } catch (err: any) {
                console.error(`Error processing event ${record.id}:`, err)
                processingStatus = 'failed'
                errorMessage = err instanceof Error ? err.message : 'Unknown Error'
            }

            // 4. Update Event Status in DB
            await supabase
                .from('stripe_events')
                .update({
                    status: processingStatus,
                    error_message: errorMessage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', record.id)

            results.push({ id: record.id, status: processingStatus })
        }

        return new Response(JSON.stringify({ processed: results }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown Error'
        console.error('Worker Error:', errorMsg)
        return new Response(JSON.stringify({ error: errorMsg }), { status: 500 })
    }
})

// --- handlers ---

// @ts-ignore
async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
    // Logic: When Escrow is funded -> Update Task Status?
    // Metadata is key here
    const { task_id, type } = paymentIntent.metadata

    if (type === 'escrow' && task_id) {
        console.log(`Escrow funded for task ${task_id}`)

        // Update Escrow Transaction
        await supabase
            .from('escrow_transactions')
            .update({
                status: 'held',
                stripe_payment_intent_id: paymentIntent.id
            })
            .eq('task_id', task_id)

        // Update Task Status (if needed, e.g. "Funded")
        // Note: status 'open' usually implies funded if created with payment
    }
}

// @ts-ignore
async function handleTransferCreated(supabase: any, transfer: any) {
    console.log(`Transfer created: ${transfer.id}`)
}
