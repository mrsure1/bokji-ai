export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      benefit_embeddings: {
        Row: {
          benefit_id: string
          content_type: string
          created_at: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          benefit_id: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          benefit_id?: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_embeddings_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_summaries: {
        Row: {
          benefit_id: string
          cautions: string | null
          created_at: string | null
          documents: string[] | null
          how_text: string | null
          id: string
          is_reviewed: boolean | null
          one_line: string | null
          terms: Json | null
          updated_at: string | null
          what: string | null
          when_text: string | null
          who: string | null
        }
        Insert: {
          benefit_id: string
          cautions?: string | null
          created_at?: string | null
          documents?: string[] | null
          how_text?: string | null
          id?: string
          is_reviewed?: boolean | null
          one_line?: string | null
          terms?: Json | null
          updated_at?: string | null
          what?: string | null
          when_text?: string | null
          who?: string | null
        }
        Update: {
          benefit_id?: string
          cautions?: string | null
          created_at?: string | null
          documents?: string[] | null
          how_text?: string | null
          id?: string
          is_reviewed?: boolean | null
          one_line?: string | null
          terms?: Json | null
          updated_at?: string | null
          what?: string | null
          when_text?: string | null
          who?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_summaries_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: true
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          apply_start: string | null
          apply_url: string | null
          benefit_summary: string | null
          category: string | null
          collected_at: string | null
          deadline: string | null
          documents: string[] | null
          external_id: string | null
          household_types: string[]
          id: string
          life_stages: string[]
          plain_summary: string | null
          provider: string | null
          raw_content: string | null
          region_scope: string | null
          region_sido: string | null
          region_sigungu: string | null
          requirements: string | null
          review_status: string | null
          source: string
          tags: string[] | null
          target_summary: string | null
          themes: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          apply_start?: string | null
          apply_url?: string | null
          benefit_summary?: string | null
          category?: string | null
          collected_at?: string | null
          deadline?: string | null
          documents?: string[] | null
          external_id?: string | null
          household_types?: string[]
          id?: string
          life_stages?: string[]
          plain_summary?: string | null
          provider?: string | null
          raw_content?: string | null
          region_scope?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          requirements?: string | null
          review_status?: string | null
          source: string
          tags?: string[] | null
          target_summary?: string | null
          themes?: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          apply_start?: string | null
          apply_url?: string | null
          benefit_summary?: string | null
          category?: string | null
          collected_at?: string | null
          deadline?: string | null
          documents?: string[] | null
          external_id?: string | null
          household_types?: string[]
          id?: string
          life_stages?: string[]
          plain_summary?: string | null
          provider?: string | null
          raw_content?: string | null
          region_scope?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          requirements?: string | null
          review_status?: string | null
          source?: string
          tags?: string[] | null
          target_summary?: string | null
          themes?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          benefit_id: string | null
          body: string | null
          channel: string
          failure_reason: string | null
          id: string
          requested_at: string | null
          sent_at: string | null
          status: string
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          benefit_id?: string | null
          body?: string | null
          channel: string
          failure_reason?: string | null
          id?: string
          requested_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          benefit_id?: string | null
          body?: string | null
          channel?: string
          failure_reason?: string | null
          id?: string
          requested_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          email_enabled: boolean | null
          frequency: string | null
          night_enabled: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_enabled?: boolean | null
          frequency?: string | null
          night_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email_enabled?: boolean | null
          frequency?: string | null
          night_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alarm_app: boolean | null
          alarm_email: boolean | null
          alarm_night: boolean | null
          alarm_sms: boolean | null
          birth_year: number | null
          created_at: string | null
          current_status: string | null
          employment_detail: string | null
          household_type: string | null
          household_situations: string[] | null
          housing_type: string | null
          id: string
          income_band: string | null
          interests: string[] | null
          name: string | null
          region_sido: string | null
          region_sigungu: string | null
          special_conditions: string[] | null
          updated_at: string | null
        }
        Insert: {
          alarm_app?: boolean | null
          alarm_email?: boolean | null
          alarm_night?: boolean | null
          alarm_sms?: boolean | null
          birth_year?: number | null
          created_at?: string | null
          current_status?: string | null
          employment_detail?: string | null
          household_type?: string | null
          household_situations?: string[] | null
          housing_type?: string | null
          id: string
          income_band?: string | null
          interests?: string[] | null
          name?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          special_conditions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alarm_app?: boolean | null
          alarm_email?: boolean | null
          alarm_night?: boolean | null
          alarm_sms?: boolean | null
          birth_year?: number | null
          created_at?: string | null
          current_status?: string | null
          employment_detail?: string | null
          household_type?: string | null
          household_situations?: string[] | null
          housing_type?: string | null
          id?: string
          income_band?: string | null
          interests?: string[] | null
          name?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          special_conditions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_benefits: {
        Row: {
          benefit_id: string
          checklist: Json | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          benefit_id: string
          checklist?: Json | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          benefit_id?: string
          checklist?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
