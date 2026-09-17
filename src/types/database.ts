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
          role: Database['public']['Enums']['user_role']
          display_name: string
          avatar_url: string | null
          phone_number: string | null
          exact_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: Database['public']['Enums']['user_role']
          display_name: string
          avatar_url?: string | null
          phone_number?: string | null
          exact_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['user_role']
          display_name?: string
          avatar_url?: string | null
          phone_number?: string | null
          exact_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          role: Database['public']['Enums']['admin_role']
          created_at: string
        }
        Insert: {
          id: string
          role: Database['public']['Enums']['admin_role']
          created_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['admin_role']
          created_at?: string
        }
      }
      teacher_profiles: {
        Row: {
          profile_id: string
          bio: string | null
          status: Database['public']['Enums']['teacher_status']
          pricing_type: Database['public']['Enums']['pricing_type'] | null
          hourly_fee: number | null
          per_class_fee: number | null
          monthly_fee: number | null
          teaching_location: Database['public']['Enums']['teaching_location'] | null
          rejection_reason: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          bio?: string | null
          status?: Database['public']['Enums']['teacher_status']
          pricing_type?: Database['public']['Enums']['pricing_type'] | null
          hourly_fee?: number | null
          per_class_fee?: number | null
          monthly_fee?: number | null
          teaching_location?: Database['public']['Enums']['teaching_location'] | null
          rejection_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          bio?: string | null
          status?: Database['public']['Enums']['teacher_status']
          pricing_type?: Database['public']['Enums']['pricing_type'] | null
          hourly_fee?: number | null
          per_class_fee?: number | null
          monthly_fee?: number | null
          teaching_location?: Database['public']['Enums']['teaching_location'] | null
          rejection_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
      }
      cities: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      localities: {
        Row: {
          id: number
          city_id: number | null
          name: string
        }
        Insert: {
          id?: number
          city_id?: number | null
          name: string
        }
        Update: {
          id?: number
          city_id?: number | null
          name?: string
        }
      }
      subjects: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      classes: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      boards: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      teacher_subjects: {
        Row: {
          teacher_id: string
          subject_id: number
        }
        Insert: {
          teacher_id: string
          subject_id: number
        }
        Update: {
          teacher_id?: string
          subject_id?: number
        }
      }
      teacher_classes: {
        Row: {
          teacher_id: string
          class_id: number
        }
        Insert: {
          teacher_id: string
          class_id: number
        }
        Update: {
          teacher_id?: string
          class_id?: number
        }
      }
      teacher_boards: {
        Row: {
          teacher_id: string
          board_id: number
        }
        Insert: {
          teacher_id: string
          board_id: number
        }
        Update: {
          teacher_id?: string
          board_id?: number
        }
      }
      teacher_localities: {
        Row: {
          teacher_id: string
          locality_id: number
        }
        Insert: {
          teacher_id: string
          locality_id: number
        }
        Update: {
          teacher_id?: string
          locality_id?: number
        }
      }
      teacher_availability: {
        Row: {
          id: string
          teacher_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: {
          id?: string
          teacher_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
        }
        Update: {
          id?: string
          teacher_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
        }
      }
      tutor_requests: {
        Row: {
          id: string
          student_id: string | null
          parent_id: string | null
          teacher_id: string | null
          subject_id: number | null
          class_id: number | null
          board_id: number | null
          locality_id: number | null
          budget_amount: number | null
          budget_type: Database['public']['Enums']['pricing_type'] | null
          message: string | null
          status: Database['public']['Enums']['request_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          parent_id?: string | null
          teacher_id?: string | null
          subject_id?: number | null
          class_id?: number | null
          board_id?: number | null
          locality_id?: number | null
          budget_amount?: number | null
          budget_type?: Database['public']['Enums']['pricing_type'] | null
          message?: string | null
          status?: Database['public']['Enums']['request_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          parent_id?: string | null
          teacher_id?: string | null
          subject_id?: number | null
          class_id?: number | null
          board_id?: number | null
          locality_id?: number | null
          budget_amount?: number | null
          budget_type?: Database['public']['Enums']['pricing_type'] | null
          message?: string | null
          status?: Database['public']['Enums']['request_status']
          created_at?: string
          updated_at?: string
        }
      }
      request_availability: {
        Row: {
          id: string
          request_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: {
          id?: string
          request_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
      }
      saved_teachers: {
        Row: {
          id: string
          user_id: string | null
          teacher_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          teacher_id?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          request_id: string | null
          reviewer_id: string | null
          teacher_id: string | null
          rating: number
          comment: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          reviewer_id?: string | null
          teacher_id?: string | null
          rating: number
          comment?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          reviewer_id?: string | null
          teacher_id?: string | null
          rating?: number
          comment?: string | null
          is_approved?: boolean
          created_at?: string
        }
      }
      verification_documents: {
        Row: {
          id: string
          teacher_id: string | null
          category: Database['public']['Enums']['verification_category']
          file_path: string
          reviewed_by: string | null
          reviewed_at: string | null
          status: Database['public']['Enums']['verification_status']
          rejection_reason: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          teacher_id?: string | null
          category: Database['public']['Enums']['verification_category']
          file_path: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: Database['public']['Enums']['verification_status']
          rejection_reason?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string | null
          category?: Database['public']['Enums']['verification_category']
          file_path?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: Database['public']['Enums']['verification_status']
          rejection_reason?: string | null
          uploaded_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          target_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      public_tutor_profiles: {
        Row: {
          teacher_id: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          pricing_type: Database['public']['Enums']['pricing_type'] | null
          hourly_fee: number | null
          per_class_fee: number | null
          monthly_fee: number | null
          teaching_location: Database['public']['Enums']['teaching_location'] | null
        }
      }
    }
    Functions: {
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verification_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_support_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_any_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_teacher_verified: {
        Args: {
          tid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "STUDENT" | "PARENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN"
      admin_role: "SUPER_ADMIN" | "VERIFICATION_ADMIN" | "SUPPORT_ADMIN"
      teacher_status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CHANGES" | "VERIFIED" | "REJECTED" | "SUSPENDED"
      verification_status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "NEEDS_CHANGES"
      pricing_type: "HOURLY" | "PER_CLASS" | "MONTHLY"
      teaching_location: "STUDENT_HOME" | "TEACHER_LOCATION" | "BOTH"
      verification_category: "IDENTITY" | "QUALIFICATION" | "EXPERIENCE"
      request_status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED"
    }
  }
}
