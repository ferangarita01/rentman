// @ts-nocheck
/*
  Deno Edge Function - Type Definitions for IDE (Antigravity)
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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        if (!record || !record.id) {
            throw new Error('No record or ID provided in webhook payload')
        }

        const { id, email, full_name } = record

        console.log(`Processing customer for profile: ${id}, email: ${email}`)

        // 1. Create Stripe Customer
        const customer = await stripe.customers.create({
            email: email,
            name: full_name || undefined,
            metadata: {
                supabase_profile_id: id,
            },
        })

        console.log(`Stripe customer created: ${customer.id}`)

        // 2. Update Supabase Profile
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true, stripe_customer_id: customer.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err: any) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error in stripe-customer-sync:', message)
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
