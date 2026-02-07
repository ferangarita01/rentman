export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            tasks: {
                Row: {
                    id: string
                    title: string
                    description: string
                    budget_amount: number
                    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
                    location_address: string | null
                    created_at: string
                    agent_id: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    description: string
                    budget_amount: number
                    status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
                    location_address?: string | null
                    created_at?: string
                    agent_id?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    budget_amount?: number
                    status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
                    location_address?: string | null
                    created_at?: string
                    agent_id?: string | null
                }
            }
            humans: {
                Row: {
                    id: string
                    display_name: string
                    reputation_score: number
                    total_tasks_completed: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    display_name: string
                    reputation_score?: number
                    total_tasks_completed?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    display_name?: string
                    reputation_score?: number
                    total_tasks_completed?: number
                    created_at?: string
                }
            }
        }
    }
}
