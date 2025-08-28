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
      profiles: {
        Row: {
          id: string
          updated_at?: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: string | null
        }
        Insert: {
          id: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
        }
      }
      support_tickets: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          name: string
          email: string
          subject: string
          message: string
          status: string
          messages?: Json | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          name: string
          email: string
          subject: string
          message: string
          status?: string
          messages?: Json | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: string
          messages?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
