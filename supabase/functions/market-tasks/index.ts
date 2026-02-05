import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-request-id, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta: {
    request_id: string
    timestamp: string
    version: string
  }
}

function jsonResponse<T>(body: APIResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  const version = 'v1'

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const status = url.searchParams.get('status') || 'OPEN'
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error

      return jsonResponse({
        success: true,
        data: tasks || [],
        meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
      })
    }

    if (req.method === 'POST') {
      const taskData = await req.json()
      
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          task_type: taskData.task_type,
          budget_amount: taskData.budget_amount,
          location_address: taskData.location?.address,
          required_skills: taskData.required_skills || [],
          status: 'OPEN',
        })
        .select()
        .single()

      if (error) throw error

      return jsonResponse({
        success: true,
        data: task,
        meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
      }, 201)
    }

    return jsonResponse({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
    }, 405)

  } catch (error) {
    return jsonResponse({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
    }, 500)
  }
})
