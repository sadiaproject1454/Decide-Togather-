export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      decision_option_points: {
        Row: {
          content: string
          created_at: string
          created_by: string
          decision_id: number
          decision_option_id: number
          id: number
          type: string
          updated_at: string
          workspace_id: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          decision_id: number
          decision_option_id: number
          id?: never
          type: string
          updated_at?: string
          workspace_id: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          decision_id?: number
          decision_option_id?: number
          id?: never
          type?: string
          updated_at?: string
          workspace_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_option_points_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_option_points_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_option_points_decision_option_id_fkey"
            columns: ["decision_option_id"]
            isOneToOne: false
            referencedRelation: "decision_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_option_points_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dop_decision_workspace_fkey"
            columns: ["decision_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "dop_option_decision_fkey"
            columns: ["decision_option_id", "decision_id"]
            isOneToOne: false
            referencedRelation: "decision_options"
            referencedColumns: ["id", "decision_id"]
          },
        ]
      }
      decision_options: {
        Row: {
          created_at: string
          decision_id: number
          id: number
          label: string
          votes: number
        }
        Insert: {
          created_at?: string
          decision_id: number
          id?: never
          label: string
          votes?: number
        }
        Update: {
          created_at?: string
          decision_id?: number
          id?: never
          label?: string
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_options_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: number
          status: string
          title: string
          workspace_id: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string
          id?: never
          status?: string
          title: string
          workspace_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: never
          status?: string
          title?: string
          workspace_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          created_at: string
          created_by: string
          decision_id: number
          description: string | null
          id: number
          source_url: string | null
          title: string
          updated_at: string
          workspace_id: number
        }
        Insert: {
          created_at?: string
          created_by: string
          decision_id: number
          description?: string | null
          id?: never
          source_url?: string | null
          title: string
          updated_at?: string
          workspace_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_id?: number
          description?: string | null
          id?: never
          source_url?: string | null
          title?: string
          updated_at?: string
          workspace_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_decision_workspace_fkey"
            columns: ["decision_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "evidence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          email: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: number
          joined_at: string
          role: string
          user_id: string
          workspace_id: number
        }
        Insert: {
          id?: never
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: number
        }
        Update: {
          id?: never
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string
          id: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: never
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: never
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_workspace_member_by_email: {
        Args: { p_email: string; p_role?: string; p_workspace_id: number };
        Returns: {
          id: number;
          joined_at: string;
          role: string;
          user_id: string;
          workspace_id: number;
        }[];
      };
      increment_option_vote: { Args: { p_option_id: number }; Returns: number };
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
