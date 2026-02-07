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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    console.log('Path:', url.pathname, 'Parts:', pathParts)
    
    // GET /market-tasks?status=OPEN
    if (req.method === 'GET') {
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

    // POST /market-tasks
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

    // PUT /market-tasks/:id/accept
    if (req.method === 'PUT' && pathParts.includes('accept')) {
      const taskId = pathParts[pathParts.length - 2]
      const { human_id } = await req.json()

      // Check if task is still available
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single()

      if (existingTask?.status !== 'OPEN') {
        return jsonResponse({
          success: false,
          error: { code: 'TASK_UNAVAILABLE', message: 'Task is no longer available' },
          meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
        }, 409)
      }

      // Update task status
      const { data: task, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'ASSIGNED',
          human_id: human_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      return jsonResponse({
        success: true,
        data: task,
        meta: { request_id: requestId, timestamp: new Date().toISOString(), version }
      })
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
